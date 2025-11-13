import os
import base64
from datetime import datetime, timedelta
from typing import List, Optional, Dict

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Body,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from jose import JWTError, jwt
from passlib.context import CryptContext

from sqlalchemy.orm import Session
from sqlalchemy import func

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from pydantic import BaseModel
from uuid import UUID
from dotenv import load_dotenv

# ---- Local imports ----
from database import engine, SessionLocal
from models import (
    Base,
    Contact,
    Company,
    Template,
    AmazonData,
    PurchaseOrder,
    ActivityLog,
    User,
    Role,
    PipelineStage,
    Deal,
    InteractionLog,
    Note,
    Reminder,
    Tag,
    TagLink,
)
from ai_service import render_template, improve_with_ai


# ======================================================================
# ENV, SECURITY, DB
# ======================================================================

load_dotenv()

SECRET_KEY = "supersecretkeychangeit"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Frontend base URL for redirect after Google login
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("⚠️ WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in .env")

# Create tables on startup
Base.metadata.create_all(bind=engine)


# ---- DB dependency ----
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---- Password + JWT helpers ----
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user


# ======================================================================
# FASTAPI + MIDDLEWARE + GOOGLE OAUTH CLIENT
# ======================================================================

app = FastAPI(title="Leverage CRM API", version="1.0")

# Session (needed for authlib CSRF state)
app.add_middleware(
    SessionMiddleware,
    secret_key="super-secret-session-key",
    session_cookie="session",
    same_site="lax",
    https_only=False,
)

# CORS – allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authlib OAuth client
oauth = OAuth()

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# ======================================================================
# BASIC ROOT
# ======================================================================

@app.get("/")
def read_root():
    return {"message": "Leverage CRM backend is running 🚀"}


# ======================================================================
# USER AUTH (EMAIL+PASSWORD) + PROFILE
# ======================================================================

@app.post("/register")
def register_user(form: dict, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == form["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role_name = form.get("role", "Team")
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)

    new_user = User(
        name=form["name"],
        email=form["email"],
        password=hash_password(form["password"]),
        role_id=role.id,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered", "user_id": str(new_user.id)}


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.password or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.name if current_user.role else None,
    }


@app.put("/users/{user_id}")
def update_user(user_id: str, data: dict = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if "name" in data:
        user.name = data["name"]

    db.commit()
    db.refresh(user)
    return {
        "message": "User updated",
        "user": {"id": str(user.id), "name": user.name, "email": user.email},
    }


# ======================================================================
# GOOGLE LOGIN FOR CRM (LOCALHOST VERSION)
# ======================================================================

# IMPORTANT:
# In Google Cloud Console, Authorized redirect URI must include:
#   http://127.0.0.1:8000/auth/google

REDIRECT_URI_GOOGLE = "http://127.0.0.1:8000/auth/google"


@app.get("/login/google")
async def login_via_google(request: Request):
    # Always use the same redirect URI that is in Google Cloud Console
    return await oauth.google.authorize_redirect(request, REDIRECT_URI_GOOGLE)


@app.get("/auth/google", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # Do NOT pass redirect_uri argument here (it caused the "multiple values" bug)
        token = await oauth.google.authorize_access_token(request)
        resp = await oauth.google.get("userinfo", token=token)
        user_info = resp.json()
    except Exception as e:
        print("Google OAuth Error:", e)
        raise HTTPException(status_code=400, detail="Google authentication failed")

    email = user_info["email"]
    name = user_info.get("name", "Google User")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        role = db.query(Role).filter(Role.name == "Team").first()
        if not role:
            role = Role(name="Team")
            db.add(role)
            db.commit()
            db.refresh(role)

        user = User(
            name=name,
            email=email,
            role_id=role.id,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    # send token to frontend
    return RedirectResponse(url=f"{FRONTEND_URL}/?token={access_token}")


# ======================================================================
# GMAIL CONNECT CALLBACK (FOR SENDING EMAIL)
# ======================================================================

@app.get("/auth/gmail/callback")
def gmail_auth_callback(request: Request, db: Session = Depends(get_db)):
    """
    Use Google OAuth2 Flow directly for Gmail send access.
    This route expects ?code=... from Google.
    """
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(400, "Missing code")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://127.0.0.1:8000/auth/gmail/callback"],
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid",
        ],
    )
    flow.redirect_uri = "http://127.0.0.1:8000/auth/gmail/callback"
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Get user email from Google
    oauth2_service = build("oauth2", "v2", credentials=creds)
    userinfo = oauth2_service.userinfo().get().execute()
    user_email = userinfo.get("email")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(404, "User not found in CRM")

    user.gmail_access_token = creds.token
    user.gmail_refresh_token = creds.refresh_token
    db.commit()
    return {"message": f"Gmail connected for {user_email}"}


# ======================================================================
# CONTACTS + COMPANIES
# ======================================================================

@app.get("/contacts")
def get_contacts(db: Session = Depends(get_db)):
    return db.query(Contact).all()


@app.post("/contacts")
def create_contact(contact: dict, db: Session = Depends(get_db)):
    new_contact = Contact(
        name=contact.get("name"),
        email=contact.get("email"),
        phone=contact.get("phone"),
        position=contact.get("position"),
        company_id=contact.get("company_id"),
        created_by=None,
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return {"message": "Contact created successfully", "contact": new_contact.id}


@app.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()


@app.post("/companies")
def create_company(company: dict, db: Session = Depends(get_db)):
    new_company = Company(
        name=company.get("name"),
        type=company.get("type"),
        country=company.get("country"),
        website=company.get("website"),
        created_by=None,
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return {"message": "Company created successfully", "company": new_company.id}


# ======================================================================
# AI TEMPLATES + AI EMAIL
# ======================================================================

class TemplateIn(BaseModel):
    title: str
    body: str
    type: str = "brand"


class TemplateOut(BaseModel):
    id: UUID
    title: str
    body: str
    type: str

    class Config:
        from_attributes = True


@app.get("/templates", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.query(Template).all()


@app.post("/templates", response_model=TemplateOut)
def create_template(t: TemplateIn, db: Session = Depends(get_db)):
    row = Template(title=t.title, body=t.body, type=t.type)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.on_event("startup")
def seed_templates():
    db = SessionLocal()
    try:
        if db.query(Template).count() == 0:
            db.add_all(
                [
                    Template(
                        title="Brand Outreach – Intro",
                        type="brand",
                        body=(
                            "Hi {{first_name}},\n\n"
                            "We help {{brand_name}} increase wholesale growth on Amazon. "
                            "We already work with brands in {{category}} and handle compliance, pricing, and inventory.\n\n"
                            "Quick 10-min call this week?\n\nThanks,\n{{sender_name}}\n{{sender_company}}"
                        ),
                    ),
                    Template(
                        title="Supplier Partnership – Inquiry",
                        type="supplier",
                        body=(
                            "Hello {{first_name}},\n\n"
                            "We're sourcing {{product_type}} for Amazon US. "
                            "Could you share your MOQ, lead time, and wholesale pricing for {{sku_or_family}}?\n\n"
                            "Regards,\n{{sender_name}}\n{{sender_company}}"
                        ),
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


class GenerateIn(BaseModel):
    template_id: Optional[str] = None
    variables: Dict[str, str] = {}
    subject: Optional[str] = None
    body_override: Optional[str] = None
    tone: str = "professional"
    length: str = "short"


class GenerateOut(BaseModel):
    subject: str
    body: str
    used_template: Optional[str] = None


@app.post("/ai/generate_email", response_model=GenerateOut)
def generate_email(payload: GenerateIn, db: Session = Depends(get_db)):
    if payload.body_override:
        drafted_body = payload.body_override
        used_template_title = None
    elif payload.template_id:
        tpl = db.query(Template).filter(Template.id == payload.template_id).first()
        if not tpl:
            raise HTTPException(404, "Template not found")
        drafted_body = render_template(tpl.body, payload.variables or {})
        used_template_title = tpl.title
    else:
        raise HTTPException(400, "Provide template_id or body_override")

    subj = payload.subject or payload.variables.get("email_subject") or "Partnership proposal"
    improved = improve_with_ai(subj, drafted_body, payload.tone, payload.length)
    return GenerateOut(
        subject=improved["subject"],
        body=improved["body"],
        used_template=used_template_title,
    )


# ======================================================================
# AMAZON + PROFIT
# ======================================================================

@app.get("/amazon/data")
def get_amazon_data(db: Session = Depends(get_db)):
    return db.query(AmazonData).all()


@app.post("/amazon/sync")
def sync_amazon_data(db: Session = Depends(get_db)):
    demo = AmazonData(
        amazon_account_id=None,
        sku="SKU-123",
        sales=1500.00,
        refunds=50.00,
        stock=120,
        synced_at=datetime.utcnow(),
    )
    db.add(demo)
    db.commit()
    db.refresh(demo)
    return {"message": "Amazon data synced", "record": demo.id}


@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(PurchaseOrder).all()


@app.get("/profit")
def get_profit(db: Session = Depends(get_db)):
    orders = db.query(PurchaseOrder).all()
    total_revenue = sum(float(o.total_amount or 0) for o in orders)
    total_expense = 0.0  # later link to expenses
    profit = total_revenue - total_expense
    return {
        "total_revenue": total_revenue,
        "total_expense": total_expense,
        "profit": profit,
    }


# ======================================================================
# ACTIVITY LOGS
# ======================================================================

@app.get("/activity_logs")
def get_activity_logs(db: Session = Depends(get_db)):
    logs = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    return logs


def log_action(db: Session, action: str, entity: str, entity_id: str, user_id: str | None = None):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()


# ======================================================================
# PIPELINE: STAGES, DEALS, TIMELINE
# ======================================================================

class StageIn(BaseModel):
    name: str
    order_index: Optional[int] = None


class StageOut(BaseModel):
    id: str
    name: str
    order_index: int

    class Config:
        from_attributes = True


class DealIn(BaseModel):
    title: str
    value: float = 0
    stage_id: str
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    due_date: Optional[str] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage_id: Optional[str] = None
    position: Optional[int] = None
    due_date: Optional[str] = None


class MovePayload(BaseModel):
    to_stage_id: str
    to_position: int


@app.get("/pipeline/stages", response_model=List[StageOut])
def list_stages(db: Session = Depends(get_db)):
    return db.query(PipelineStage).order_by(PipelineStage.order_index.asc()).all()


@app.post("/pipeline/stages", response_model=StageOut)
def create_stage(payload: StageIn, db: Session = Depends(get_db)):
    idx = payload.order_index
    if idx is None:
        max_idx = db.query(func.max(PipelineStage.order_index)).scalar() or 0
        idx = max_idx + 1
    row = PipelineStage(name=payload.name, order_index=idx)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/pipeline/stages/reorder")
def reorder_stages(order: List[str], db: Session = Depends(get_db)):
    for i, sid in enumerate(order):
        db.query(PipelineStage).filter(PipelineStage.id == sid).update(
            {"order_index": i}
        )
    db.commit()
    return {"message": "Stages reordered"}


@app.get("/pipeline/deals")
def list_deals(stage_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Deal).order_by(Deal.position.asc(), Deal.created_at.asc())
    if stage_id:
        q = q.filter(Deal.stage_id == stage_id)
    return q.all()


@app.post("/pipeline/deals")
def create_deal(payload: DealIn, db: Session = Depends(get_db)):
    max_pos = (
        db.query(func.max(Deal.position))
        .filter(Deal.stage_id == payload.stage_id)
        .scalar()
        or 0
    )
    row = Deal(
        title=payload.title,
        value=payload.value or 0,
        stage_id=payload.stage_id,
        company_id=payload.company_id,
        contact_id=payload.contact_id,
        due_date=payload.due_date,
        position=max_pos + 1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"message": "Deal created", "id": str(row.id)}


@app.put("/pipeline/deals/{deal_id}")
def update_deal(deal_id: str, payload: DealUpdate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(404, "Deal not found")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(deal, k, v)
    deal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(deal)
    return {"message": "Deal updated"}


@app.put("/pipeline/deals/{deal_id}/move")
def move_deal(deal_id: str, payload: MovePayload, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(404, "Deal not found")

    db.query(Deal).filter(
        Deal.stage_id == payload.to_stage_id, Deal.position >= payload.to_position
    ).update({"position": Deal.position + 1})
    deal.stage_id = payload.to_stage_id
    deal.position = payload.to_position
    deal.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Moved"}


@app.get("/pipeline/timeline")
def timeline(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.date(Deal.due_date).label("d"),
            func.count(Deal.id),
            func.coalesce(func.sum(Deal.value), 0),
        )
        .filter(Deal.due_date.isnot(None))
        .group_by(func.date(Deal.due_date))
        .order_by(func.date(Deal.due_date))
        .all()
    )
    return [
        {"date": str(r[0]), "count": int(r[1]), "value": float(r[2])}
        for r in rows
    ]


# ======================================================================
# NOTES, REMINDERS, INTERACTIONS, NEXT STEP
# ======================================================================

class NoteIn(BaseModel):
    content: str
    related_type: str
    related_id: str


@app.get("/notes/{related_type}/{related_id}")
def list_notes(related_type: str, related_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Note)
        .filter(Note.related_type == related_type, Note.related_id == related_id)
        .order_by(Note.created_at.desc())
        .all()
    )


@app.post("/notes")
def create_note(payload: NoteIn, db: Session = Depends(get_db)):
    note = Note(**payload.dict(), created_at=datetime.utcnow())
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"message": "Note added", "id": str(note.id)}


class ReminderIn(BaseModel):
    title: str
    related_type: str
    related_id: str
    due_date: str


@app.get("/reminders")
def list_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).order_by(Reminder.due_date.asc()).all()


@app.post("/reminders")
def create_reminder(payload: ReminderIn, db: Session = Depends(get_db)):
    reminder = Reminder(**payload.dict(), created_at=datetime.utcnow())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {"message": "Reminder added", "id": str(reminder.id)}


@app.put("/reminders/{reminder_id}/complete")
def mark_reminder_done(reminder_id: str, db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    r.completed = 1
    db.commit()
    return {"message": "Reminder completed"}


class InteractionIn(BaseModel):
    type: str  # 'call' or 'email'
    subject: Optional[str] = None
    summary: Optional[str] = None
    related_type: str
    related_id: str


@app.get("/interactions/{related_type}/{related_id}")
def list_interactions(related_type: str, related_id: str, db: Session = Depends(get_db)):
    return (
        db.query(InteractionLog)
        .filter(
            InteractionLog.related_type == related_type,
            InteractionLog.related_id == related_id,
        )
        .order_by(InteractionLog.created_at.desc())
        .all()
    )


@app.post("/interactions")
def create_interaction(payload: InteractionIn, db: Session = Depends(get_db)):
    log_row = InteractionLog(**payload.dict(), created_at=datetime.utcnow())
    db.add(log_row)
    db.commit()
    db.refresh(log_row)
    return {"message": "Interaction logged", "id": str(log_row.id)}


@app.get("/smart/next_step/{related_type}/{related_id}")
def next_step_suggestion(related_type: str, related_id: str, db: Session = Depends(get_db)):
    last_call = (
        db.query(InteractionLog)
        .filter(
            InteractionLog.related_type == related_type,
            InteractionLog.related_id == related_id,
            InteractionLog.type == "call",
        )
        .order_by(InteractionLog.created_at.desc())
        .first()
    )
    last_email = (
        db.query(InteractionLog)
        .filter(
            InteractionLog.related_type == related_type,
            InteractionLog.related_id == related_id,
            InteractionLog.type == "email",
        )
        .order_by(InteractionLog.created_at.desc())
        .first()
    )

    now = datetime.utcnow()
    if not last_call or (now - last_call.created_at).days >= 7:
        return {"suggestion": "Schedule a follow-up call"}
    if not last_email or (now - last_email.created_at).days >= 5:
        return {"suggestion": "Send a follow-up email"}
    return {"suggestion": "No action needed today"}


# ======================================================================
# TAGS + GLOBAL SEARCH
# ======================================================================

class TagIn(BaseModel):
    name: str
    color: Optional[str] = None


@app.get("/tags")
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()


@app.post("/tags")
def create_tag(payload: TagIn, db: Session = Depends(get_db)):
    tag = Tag(name=payload.name, color=payload.color or "#6366f1")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return {"message": "Tag created", "id": str(tag.id)}


@app.post("/tags/link")
def link_tag(tag_id: str, related_type: str, related_id: str, db: Session = Depends(get_db)):
    link = TagLink(tag_id=tag_id, related_type=related_type, related_id=related_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return {"message": "Tag linked"}


@app.get("/tags/{related_type}/{related_id}")
def get_tags(related_type: str, related_id: str, db: Session = Depends(get_db)):
    links = (
        db.query(TagLink)
        .filter(TagLink.related_type == related_type, TagLink.related_id == related_id)
        .all()
    )
    return [{"id": l.tag.id, "name": l.tag.name, "color": l.tag.color} for l in links]


@app.get("/search")
def search_entities(q: str, db: Session = Depends(get_db)):
    deals = db.query(Deal).filter(Deal.title.ilike(f"%{q}%")).all()
    contacts = db.query(Contact).filter(Contact.name.ilike(f"%{q}%")).all()
    companies = db.query(Company).filter(Company.name.ilike(f"%{q}%")).all()
    return {"deals": deals, "contacts": contacts, "companies": companies}


# ======================================================================
# EMAILS (RECENT SAMPLE + SEND VIA GMAIL)
# ======================================================================

@app.get("/emails/recent")
def get_recent_emails():
    # Placeholder sample for dashboard UI
    return {
        "emails": [
            {
                "from": "partner@brand.com",
                "subject": "Follow-up on Amazon Sales",
                "date": "2025-11-12",
            },
            {
                "from": "supplier@vendor.com",
                "subject": "New Product Catalogue",
                "date": "2025-11-11",
            },
        ]
    }


@app.post("/email/send_gmail")
def send_gmail(payload: dict, db: Session = Depends(get_db)):
    user_email = payload.get("user_email")
    if not user_email:
        raise HTTPException(400, "user_email required")

    user = db.query(User).filter(User.email == user_email).first()
    if not user or not user.gmail_access_token:
        raise HTTPException(401, "Gmail not connected for this user")

    creds = Credentials(
        token=user.gmail_access_token,
        refresh_token=user.gmail_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )

    try:
        service = build("gmail", "v1", credentials=creds)
        message = MIMEText(payload["body"])
        message["to"] = payload["to"]
        message["subject"] = payload["subject"]

        raw = {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}
        service.users().messages().send(userId="me", body=raw).execute()
        return {"message": f"Email sent via {user_email}"}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
