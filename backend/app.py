import os
import base64
from datetime import datetime, timedelta, date
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
from starlette.datastructures import URL

from jose import JWTError, jwt
from passlib.context import CryptContext

from sqlalchemy.orm import Session
from sqlalchemy import func

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request as GoogleAuthRequest

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
    Shipment,
    Invoice,
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


def calculate_landed_cost_metrics(
    units_total: int,
    cogs_total: float,
    freight_cost: float = 0,
    customs_cost: float = 0,
    fba_fees: float = 0,
    other_costs: float = 0,
    expected_revenue: float | None = None,
) -> Dict[str, float]:
    """Return total cost, cost per unit, and expected gross margin %."""
    units = max(units_total or 0, 1)
    total_cost = float(cogs_total or 0) + float(freight_cost or 0) + float(customs_cost or 0) + float(fba_fees or 0) + float(other_costs or 0)
    cost_per_unit = total_cost / units if units else 0
    margin_percent = 0.0
    if expected_revenue and expected_revenue > 0:
        margin_percent = ((expected_revenue - total_cost) / expected_revenue) * 100
    return {
        "total_cost": total_cost,
        "cost_per_unit": cost_per_unit,
        "margin_percent": margin_percent,
    }


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

# Middleware to fix request URL scheme in production (for authlib)
# This ensures request.url always has a proper scheme
@app.middleware("http")
async def fix_request_scheme(request: Request, call_next):
    """Fix request URL scheme for production environments (Render, etc.)"""
    # In production behind a proxy, request.url.scheme might be empty
    # authlib needs it to construct URLs properly
    if not getattr(request.url, 'scheme', None):
        # Detect scheme from X-Forwarded-Proto header (Render sets this)
        forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
        scheme = forwarded_proto if forwarded_proto in ['http', 'https'] else 'https'
        
        # Reconstruct URL with proper scheme
        host = request.headers.get('host') or request.headers.get('x-forwarded-host', 'crm-o52e.onrender.com')
        path = str(request.url.path)
        query = str(request.url.query) if request.url.query else ''
        
        # Create new URL with scheme - Starlette URL is immutable, so we patch the request
        if query:
            new_url_str = f"{scheme}://{host}{path}?{query}"
        else:
            new_url_str = f"{scheme}://{host}{path}"
        
        # Patch the request's URL by replacing the internal _url attribute
        # This is a workaround for Starlette's immutable URL
        from starlette.datastructures import URL
        request._url = URL(new_url_str)
        print(f"🔧 Fixed request URL scheme: {new_url_str}")
    
    response = await call_next(request)
    return response

# CORS – allow frontend (local and production)
frontend_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    "https://crm-kappa-pied.vercel.app",  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define redirect URI before OAuth registration
# Use production URL from environment, otherwise use localhost
# This allows the same code to work in both local and production
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
print(f"🔍 BACKEND_URL from env: {BACKEND_URL}")

# For production on Render, ensure it has https://
if BACKEND_URL and not BACKEND_URL.startswith(("http://", "https://")):
    # Auto-detect: if it contains render.com, use https, otherwise http
    if "render.com" in BACKEND_URL or "onrender.com" in BACKEND_URL:
        BACKEND_URL = f"https://{BACKEND_URL}"
    else:
        BACKEND_URL = f"http://{BACKEND_URL}"
elif not BACKEND_URL:
    BACKEND_URL = "http://127.0.0.1:8000"

# Default redirect URI (will be overridden dynamically in production)
REDIRECT_URI_GOOGLE = f"{BACKEND_URL}/auth/google"
print(f"🔧 Configured REDIRECT_URI_GOOGLE (default): {REDIRECT_URI_GOOGLE}")
print(f"🔍 Full BACKEND_URL after processing: {BACKEND_URL}")

# Authlib OAuth client
oauth = OAuth()

# Only register OAuth if credentials are provided
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
else:
    print("⚠️  WARNING: Google OAuth not configured. GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing.")


# ======================================================================
# BASIC ROOT
# ======================================================================

@app.get("/")
def read_root():
    return {"message": "Leverage CRM backend is running 🚀"}


@app.get("/debug/oauth")
def debug_oauth():
    """Debug endpoint to check OAuth configuration"""
    return {
        "google_client_id_set": bool(GOOGLE_CLIENT_ID),
        "google_client_secret_set": bool(GOOGLE_CLIENT_SECRET),
        "google_client_id_preview": GOOGLE_CLIENT_ID[:20] + "..." if GOOGLE_CLIENT_ID else None,
        "frontend_url": FRONTEND_URL,
        "redirect_uri": REDIRECT_URI_GOOGLE,
        "oauth_registered": "google" in oauth._clients if hasattr(oauth, "_clients") else False,
    }

@app.get("/debug/gmail")
def debug_gmail(request: Request):
    """Debug endpoint to check Gmail OAuth redirect URI"""
    host = request.headers.get('host', '')
    scheme = request.headers.get('x-forwarded-proto', 'http')
    
    if host and ('onrender.com' in host or 'render.com' in host):
        if scheme not in ['http', 'https']:
            scheme = 'https'
        redirect_uri = f"{scheme}://{host}/auth/gmail/callback"
    else:
        redirect_uri = "http://127.0.0.1:8000/auth/gmail/callback"
    
    return {
        "gmail_redirect_uri": redirect_uri,
        "request_host": host,
        "request_scheme": scheme,
        "google_client_id_set": bool(GOOGLE_CLIENT_ID),
        "google_client_secret_set": bool(GOOGLE_CLIENT_SECRET),
        "instructions": "Add this redirect_uri to Google Cloud Console → APIs & Services → Credentials → Your OAuth 2.0 Client → Authorized redirect URIs"
    }


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
# In Google Cloud Console, Authorized redirect URIs must include:
#   For local: http://127.0.0.1:8000/auth/google
#   For production: https://crm-o52e.onrender.com/auth/google
# (REDIRECT_URI_GOOGLE is now defined above, before OAuth registration)


@app.get("/login/google")
async def login_via_google(request: Request):
    # Check if OAuth is configured
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
        )
    
    # Detect production URL from request if BACKEND_URL env var is not set properly
    # This is critical for production deployments
    redirect_uri = REDIRECT_URI_GOOGLE
    
    # If we're in production (detected by host header), use the production URL
    host = request.headers.get('host', '')
    if host and ('onrender.com' in host or 'render.com' in host):
        # We're in production - construct the redirect URI from the request
        scheme = request.headers.get('x-forwarded-proto', 'https')
        if scheme not in ['http', 'https']:
            scheme = 'https'
        redirect_uri = f"{scheme}://{host}/auth/google"
        print(f"🔍 Detected production environment, using redirect_uri: {redirect_uri}")
    elif redirect_uri.startswith("http://127.0.0.1") and host and host != "127.0.0.1:8000":
        # BACKEND_URL wasn't set, but we're clearly in production
        # Try to construct from request
        scheme = request.headers.get('x-forwarded-proto', 'https')
        if scheme not in ['http', 'https']:
            scheme = 'https'
        redirect_uri = f"{scheme}://{host}/auth/google"
        print(f"🔍 Overriding localhost redirect_uri with production: {redirect_uri}")
    
    # Ensure redirect_uri has proper protocol
    if not redirect_uri.startswith(("http://", "https://")):
        redirect_uri = f"https://{redirect_uri}" if 'onrender.com' in redirect_uri else f"http://{redirect_uri}"
    
    print(f"🔍 Initiating Google OAuth with redirect_uri: {redirect_uri}")
    print(f"🔍 Request host: {host}")
    print(f"🔍 BACKEND_URL env: {os.getenv('BACKEND_URL', 'NOT SET')}")
    
    # Always use the same redirect URI that is in Google Cloud Console
    # This saves the redirect_uri in the session state for later retrieval
    return await oauth.google.authorize_redirect(request, redirect_uri)


async def manual_token_exchange(request: Request, code: str, redirect_uri: str):
    """
    Manual OAuth token exchange - bypasses authlib's URL construction issues.
    This is used as a fallback when authlib fails with "Request URL missing protocol" error.
    """
    import httpx
    
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    print(f"🔧 Manual token exchange:")
    print(f"   Token URL: {token_url}")
    print(f"   Redirect URI: {redirect_uri}")
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_url,
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
    
    if token_response.status_code != 200:
        error_text = token_response.text
        print(f"❌ Manual token exchange failed: {error_text}")
        raise HTTPException(
            status_code=400,
            detail=f"Token exchange failed: {error_text}"
        )
    
    token_result = token_response.json()
    return token_result


@app.get("/auth/google", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # Check if we have the required credentials
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=500,
                detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
            )
        
        # Debug: Log the request URL and query params
        print(f"🔍 OAuth Callback - URL: {request.url}")
        print(f"🔍 OAuth Callback - Query params: {dict(request.query_params)}")
        
        # Check for error from Google
        error = request.query_params.get("error")
        if error:
            error_description = request.query_params.get("error_description", "Unknown error")
            error_uri = request.query_params.get("error_uri", "")
            print(f"❌ Google OAuth Error from callback: {error}")
            print(f"   Description: {error_description}")
            print(f"   URI: {error_uri}")
            raise HTTPException(
                status_code=400,
                detail=f"Google authentication error: {error}. {error_description}"
            )
        
        # Check if we have a code parameter
        code = request.query_params.get("code")
        if not code:
            print("❌ No authorization code received from Google")
            print(f"   Available params: {list(request.query_params.keys())}")
            raise HTTPException(
                status_code=400,
                detail="No authorization code received from Google. The OAuth flow may have been interrupted."
            )
        
        print(f"✅ Received authorization code: {code[:20]}...")
        
        # Get redirect_uri from session (saved during authorize_redirect)
        # If not in session, construct from request headers
        redirect_uri = None
        if hasattr(request, 'session') and request.session:
            # authlib stores redirect_uri in session - find it
            session_data = dict(request.session) if request.session else {}
            for key in session_data.keys():
                if 'redirect_uri' in str(key).lower():
                    redirect_uri = session_data.get(key)
                    print(f"🔍 Found redirect_uri in session: {redirect_uri}")
                    break
        
        # If not in session, construct from request headers
        if not redirect_uri:
            scheme = request.headers.get('x-forwarded-proto', 'https')
            if scheme not in ['http', 'https']:
                scheme = 'https'
            host = request.headers.get('x-forwarded-host') or request.headers.get('host', 'crm-o52e.onrender.com')
            redirect_uri = f"{scheme}://{host}/auth/google"
            print(f"🔧 Constructed redirect_uri from headers: {redirect_uri}")
        
        # authlib automatically retrieves redirect_uri from the session state
        # Do NOT pass redirect_uri explicitly - it causes "multiple values" error
        # The redirect_uri is saved in session during authorize_redirect
        try:
            # Check session state for debugging
            if hasattr(request, 'session'):
                session_data = dict(request.session) if request.session else {}
                print(f"🔍 Session state keys: {list(session_data.keys())}")
                # Check if redirect_uri is in session
                for key in session_data.keys():
                    if 'redirect_uri' in str(key).lower() or 'state' in str(key).lower():
                        print(f"🔍 Found session key: {key}")
            
            # CRITICAL FIX: Ensure request.url has scheme before authlib accesses it
            # authlib internally uses request.url to construct URLs, and it MUST have a scheme
            # Based on web search: This is a common issue with authlib in production behind proxies
            scheme = getattr(request.url, 'scheme', None)
            if not scheme:
                # Detect from headers (Render sets X-Forwarded-Proto)
                forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
                scheme = forwarded_proto if forwarded_proto in ['http', 'https'] else 'https'
                host = request.headers.get('x-forwarded-host') or request.headers.get('host', 'crm-o52e.onrender.com')
                path = str(request.url.path)
                query = str(request.url.query) if request.url.query else ''
                
                new_url_str = f"{scheme}://{host}{path}?{query}" if query else f"{scheme}://{host}{path}"
                
                # Force patch the request URL - this is critical for authlib
                # Starlette URL is immutable, but we can replace the internal _url attribute
                from starlette.datastructures import URL
                request._url = URL(new_url_str)
                print(f"🔧 CRITICAL: Fixed request URL before authlib: {new_url_str}")
            
            # Log request details for debugging
            print(f"🔍 BEFORE token exchange:")
            print(f"   Request scheme: {getattr(request.url, 'scheme', 'NONE')}")
            print(f"   Request URL: {str(request.url)}")
            print(f"   Request host: {request.headers.get('host', 'N/A')}")
            print(f"   X-Forwarded-Proto: {request.headers.get('x-forwarded-proto', 'N/A')}")
            
            # Verify the URL is correct before passing to authlib
            final_scheme = getattr(request.url, 'scheme', None)
            if not final_scheme:
                # Last resort: Try to create a mock request with proper URL
                print(f"⚠️  WARNING: URL scheme still missing! Attempting workaround...")
                # We'll let it fail and catch the error to provide better debugging
                raise HTTPException(
                    status_code=500,
                    detail="Internal error: Request URL missing scheme after all fixes. Check Render logs for details."
                )
            
            # ALTERNATIVE: Manual token exchange if authlib fails
            # This bypasses authlib's URL construction that causes "Request URL missing protocol" error
            try:
                print(f"🔍 Attempting token exchange with authlib (scheme: {final_scheme})...")
        token = await oauth.google.authorize_access_token(request)
                print(f"✅ Successfully obtained access token via authlib")
            except Exception as authlib_error:
                error_msg = str(authlib_error)
                if "Request URL is missing" in error_msg or "protocol" in error_msg.lower():
                    print(f"⚠️  authlib failed with protocol error, using manual token exchange...")
                    # Manual token exchange - bypasses authlib's URL construction
                    token = await manual_token_exchange(request, code, redirect_uri)
                    print(f"✅ Successfully obtained access token via manual exchange")
                else:
                    # Re-raise if it's a different error
                    raise
        except Exception as token_error:
            error_msg = str(token_error)
            print(f"❌ Failed to get access token:")
            print(f"   Error type: {type(token_error).__name__}")
            print(f"   Error message: {error_msg}")
            
            # Log session state for debugging
            if hasattr(request, 'session'):
                print(f"🔍 Session state: {dict(request.session) if request.session else 'No session'}")
            
            # Log request details
            print(f"🔍 Request URL: {request.url}")
            print(f"🔍 Request scheme: {getattr(request.url, 'scheme', 'N/A')}")
            print(f"🔍 Request host header: {request.headers.get('host', 'N/A')}")
            
            import traceback
            print(traceback.format_exc())
            raise
        
        if not token:
            raise HTTPException(status_code=400, detail="Failed to get access token from Google")
        
        # Extract access_token from token dict (authlib returns dict, manual returns dict too)
        access_token_str = token.get("access_token") if isinstance(token, dict) else token
        
        print(f"✅ Access token obtained, fetching user info...")
        
        # Get user info - use manual method if token is from manual exchange
        if isinstance(token, dict) and "access_token" in token:
            # Manual exchange was used - get user info manually
            import httpx
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            async with httpx.AsyncClient() as client:
                userinfo_response = await client.get(
                    userinfo_url,
                    headers={"Authorization": f"Bearer {access_token_str}"}
                )
            if userinfo_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info from Google")
            user_info = userinfo_response.json()
        else:
            # authlib was used - use authlib's method
        resp = await oauth.google.get("userinfo", token=token)
        user_info = resp.json()
        print(f"✅ User info received: {user_info.get('email', 'No email')}")
        
        if not user_info or "email" not in user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_trace = traceback.format_exc()
        print("❌ Google OAuth Error Details:")
        print(error_trace)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        # Provide more helpful error message
        error_detail = str(e)
        if "redirect_uri_mismatch" in error_detail.lower():
            raise HTTPException(
                status_code=400,
                detail="Redirect URI mismatch. Make sure 'http://127.0.0.1:8000/auth/google' is in Google Cloud Console redirect URIs"
            )
        elif "invalid_client" in error_detail.lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid Google Client ID or Secret. Check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
            )
        elif "access_denied" in error_detail.lower():
            raise HTTPException(
                status_code=400,
                detail="Access denied. User cancelled the Google authentication"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Google authentication failed: {error_detail}. Check server logs for details."
            )

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
# GMAIL CONNECT (FOR SENDING EMAIL)
# ======================================================================

@app.get("/auth/gmail")
def gmail_auth_start(request: Request):
    """
    Start Gmail OAuth flow - redirects to Google consent screen.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(500, "Gmail OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET")
    
    # Detect environment from request headers (similar to Google login)
    host = request.headers.get('host', '')
    scheme = request.headers.get('x-forwarded-proto', 'http')
    
    # Determine redirect URI based on environment
    if host and ('onrender.com' in host or 'render.com' in host):
        # Production on Render
        if scheme not in ['http', 'https']:
            scheme = 'https'
        redirect_uri = f"{scheme}://{host}/auth/gmail/callback"
        print(f"🔍 Detected production environment (Render), using redirect_uri: {redirect_uri}")
    else:
        # Local development
        redirect_uri = "http://127.0.0.1:8000/auth/gmail/callback"
        print(f"🔍 Using local redirect_uri: {redirect_uri}")
    
    print(f"🔧 Gmail OAuth redirect URI: {redirect_uri}")
    print(f"🔧 Request host: {host}")
    print(f"🔧 Request scheme: {scheme}")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid",
        ],
    )
    flow.redirect_uri = redirect_uri
    
    # Generate authorization URL
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    
    print(f"🔧 Gmail OAuth redirect URI: {redirect_uri}")
    print(f"🔧 Gmail OAuth authorization URL: {authorization_url}")
    
    return RedirectResponse(url=authorization_url)


@app.get("/auth/gmail/callback")
def gmail_auth_callback(request: Request, db: Session = Depends(get_db)):
    """
    Use Google OAuth2 Flow directly for Gmail send access.
    This route expects ?code=... from Google.
    """
    try:
        # Check for error from Google
        error = request.query_params.get("error")
        if error:
            error_description = request.query_params.get("error_description", "Unknown error")
            print(f"❌ Gmail OAuth Error from callback: {error} - {error_description}")
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error={error}")
        
    code = request.query_params.get("code")
    if not code:
            print("❌ No authorization code received from Google")
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=no_code")
        
        print(f"✅ Received Gmail authorization code: {code[:20]}...")

        # Detect environment from request headers (must match what was used in /auth/gmail)
        host = request.headers.get('host', '')
        scheme = request.headers.get('x-forwarded-proto', 'http')
        
        # Determine redirect URI based on environment (must match /auth/gmail)
        if host and ('onrender.com' in host or 'render.com' in host):
            # Production on Render
            if scheme not in ['http', 'https']:
                scheme = 'https'
            redirect_uri = f"{scheme}://{host}/auth/gmail/callback"
            print(f"🔍 Callback: Detected production environment (Render), using redirect_uri: {redirect_uri}")
        else:
            # Local development
            redirect_uri = "http://127.0.0.1:8000/auth/gmail/callback"
            print(f"🔍 Callback: Using local redirect_uri: {redirect_uri}")
        
        print(f"🔧 Gmail OAuth callback redirect URI: {redirect_uri}")
        
        # Create OAuth flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri],
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            "openid",
        ],
    )
        flow.redirect_uri = redirect_uri
        
        # Exchange code for token
        print(f"🔍 Exchanging authorization code for access token...")
        try:
    flow.fetch_token(code=code)
    creds = flow.credentials
            print(f"✅ Successfully obtained Gmail access token")
        except Exception as token_error:
            error_msg = str(token_error)
            print(f"❌ Failed to exchange code for token:")
            print(f"   Error type: {type(token_error).__name__}")
            print(f"   Error message: {error_msg}")
            import traceback
            print(traceback.format_exc())
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=token_exchange_failed")

    # Get user email from Google
        print(f"🔍 Fetching user info from Google...")
        try:
    oauth2_service = build("oauth2", "v2", credentials=creds)
    userinfo = oauth2_service.userinfo().get().execute()
    user_email = userinfo.get("email")
            print(f"✅ User email retrieved: {user_email}")
        except Exception as userinfo_error:
            error_msg = str(userinfo_error)
            print(f"❌ Failed to get user info:")
            print(f"   Error type: {type(userinfo_error).__name__}")
            print(f"   Error message: {error_msg}")
            import traceback
            print(traceback.format_exc())
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=userinfo_failed")

        if not user_email:
            print(f"❌ No email in user info response")
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=no_email")

        # Find user in database
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
            print(f"❌ User not found in CRM: {user_email}")
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=user_not_found")

        # Save Gmail tokens
        print(f"🔍 Saving Gmail tokens for user: {user_email}")
        try:
    user.gmail_access_token = creds.token
    user.gmail_refresh_token = creds.refresh_token
    db.commit()
            print(f"✅ Gmail tokens saved successfully")
        except Exception as db_error:
            error_msg = str(db_error)
            print(f"❌ Failed to save Gmail tokens:")
            print(f"   Error type: {type(db_error).__name__}")
            print(f"   Error message: {error_msg}")
            import traceback
            print(traceback.format_exc())
            db.rollback()
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=save_failed")
        
        # Redirect back to frontend with success message
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        print(f"✅ Gmail OAuth completed successfully, redirecting to frontend")
        return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_connected=true")
    
    except Exception as e:
        # Catch any unexpected errors
        error_msg = str(e)
        print(f"❌ Unexpected error in Gmail OAuth callback:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {error_msg}")
        import traceback
        print(traceback.format_exc())
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{FRONTEND_URL}/ai-outreach?gmail_error=unexpected_error")


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


class PurchaseOrderCreate(BaseModel):
    company_id: str
    deal_id: Optional[str] = None
    reference: Optional[str] = None
    order_date: Optional[date] = None
    expected_ship_date: Optional[date] = None
    expected_arrival_date: Optional[date] = None
    currency: str = "USD"
    payment_terms: Optional[str] = None
    incoterm: Optional[str] = None
    units_total: int
    cogs_total: float
    freight_cost: float = 0
    customs_cost: float = 0
    fba_fees: float = 0
    other_costs: float = 0
    notes: Optional[str] = None


class PurchaseOrderCostUpdate(BaseModel):
    units_total: Optional[int] = None
    cogs_total: Optional[float] = None
    freight_cost: Optional[float] = None
    customs_cost: Optional[float] = None
    fba_fees: Optional[float] = None
    other_costs: Optional[float] = None


class ShipmentCreate(BaseModel):
    purchase_order_id: str
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    status: str = "label_created"
    departed_at: Optional[datetime] = None
    eta: Optional[datetime] = None
    notes: Optional[str] = None


class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    status: Optional[str] = None
    departed_at: Optional[datetime] = None
    eta: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None


class InvoiceCreate(BaseModel):
    purchase_order_id: str
    invoice_number: Optional[str] = None
    amount: float
    currency: str = "USD"
    status: str = "issued"
    due_date: Optional[date] = None
    file_url: Optional[str] = None
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


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
    orders = db.query(PurchaseOrder).order_by(PurchaseOrder.order_date.desc().nulls_last()).all()
    return orders


@app.get("/orders/{po_id}")
def get_order_detail(po_id: str, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not order:
        raise HTTPException(404, "Purchase order not found")
    shipments = db.query(Shipment).filter(Shipment.purchase_order_id == po_id).all()
    invoices = db.query(Invoice).filter(Invoice.purchase_order_id == po_id).all()
    return {
        "order": order,
        "shipments": shipments,
        "invoices": invoices,
    }


@app.post("/orders")
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    
    expected_revenue = None
    if payload.deal_id:
        deal = db.query(Deal).filter(Deal.id == payload.deal_id).first()
        if deal:
            expected_revenue = float(deal.value or 0)
        else:
            raise HTTPException(404, "Deal not found")
    
    metrics = calculate_landed_cost_metrics(
        payload.units_total,
        payload.cogs_total,
        payload.freight_cost,
        payload.customs_cost,
        payload.fba_fees,
        payload.other_costs,
        expected_revenue=expected_revenue,
    )
    
    order = PurchaseOrder(
        deal_id=payload.deal_id,
        company_id=payload.company_id,
        reference=payload.reference,
        order_date=payload.order_date,
        expected_ship_date=payload.expected_ship_date,
        expected_arrival_date=payload.expected_arrival_date,
        currency=payload.currency,
        payment_terms=payload.payment_terms,
        incoterm=payload.incoterm,
        units_total=payload.units_total,
        cogs_total=payload.cogs_total,
        freight_cost=payload.freight_cost,
        customs_cost=payload.customs_cost,
        fba_fees=payload.fba_fees,
        other_costs=payload.other_costs,
        total_amount=metrics["total_cost"],
        landed_cost_per_unit=metrics["cost_per_unit"],
        expected_margin_percent=metrics["margin_percent"],
        status="draft",
        notes=payload.notes,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "Purchase order created", "id": str(order.id)}


@app.post("/orders/from-deal/{deal_id}")
def create_po_from_deal(deal_id: str, payload: PurchaseOrderCostUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(404, "Deal not found")
    if not deal.company_id:
        raise HTTPException(400, "Deal is missing an associated company")
    
    units_total = payload.units_total or 0
    cogs_total = payload.cogs_total or float(deal.value or 0)
    freight = payload.freight_cost or 0
    customs = payload.customs_cost or 0
    fba = payload.fba_fees or 0
    other = payload.other_costs or 0
    
    metrics = calculate_landed_cost_metrics(
        units_total,
        cogs_total,
        freight,
        customs,
        fba,
        other,
        expected_revenue=float(deal.value or 0),
    )
    
    order = PurchaseOrder(
        deal_id=deal.id,
        company_id=deal.company_id,
        reference=f"PO-{str(deal.id)[:6].upper()}",
        order_date=datetime.utcnow().date(),
        units_total=units_total,
        cogs_total=cogs_total,
        freight_cost=freight,
        customs_cost=customs,
        fba_fees=fba,
        other_costs=other,
        total_amount=metrics["total_cost"],
        landed_cost_per_unit=metrics["cost_per_unit"],
        expected_margin_percent=metrics["margin_percent"],
        status="draft",
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "Purchase order drafted from deal", "id": str(order.id)}


@app.put("/orders/{po_id}/costs")
def update_po_costs(po_id: str, payload: PurchaseOrderCostUpdate, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not order:
        raise HTTPException(404, "Purchase order not found")
    
    if payload.units_total is not None:
        order.units_total = payload.units_total
    if payload.cogs_total is not None:
        order.cogs_total = payload.cogs_total
    if payload.freight_cost is not None:
        order.freight_cost = payload.freight_cost
    if payload.customs_cost is not None:
        order.customs_cost = payload.customs_cost
    if payload.fba_fees is not None:
        order.fba_fees = payload.fba_fees
    if payload.other_costs is not None:
        order.other_costs = payload.other_costs
    
    expected_revenue = None
    if order.deal_id:
        deal = db.query(Deal).filter(Deal.id == order.deal_id).first()
        if deal:
            expected_revenue = float(deal.value or 0)
    
    metrics = calculate_landed_cost_metrics(
        order.units_total or 0,
        float(order.cogs_total or 0),
        float(order.freight_cost or 0),
        float(order.customs_cost or 0),
        float(order.fba_fees or 0),
        float(order.other_costs or 0),
        expected_revenue=expected_revenue,
    )
    order.total_amount = metrics["total_cost"]
    order.landed_cost_per_unit = metrics["cost_per_unit"]
    order.expected_margin_percent = metrics["margin_percent"]
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return {"message": "Purchase order costs updated", "totals": metrics}


@app.post("/shipments")
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == payload.purchase_order_id).first()
    if not order:
        raise HTTPException(404, "Purchase order not found")
    shipment = Shipment(
        purchase_order_id=payload.purchase_order_id,
        carrier=payload.carrier,
        tracking_number=payload.tracking_number,
        status=payload.status,
        departed_at=payload.departed_at,
        eta=payload.eta,
        notes=payload.notes,
        last_checked_at=datetime.utcnow(),
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return {"message": "Shipment created", "id": str(shipment.id)}


@app.put("/shipments/{shipment_id}")
def update_shipment(shipment_id: str, payload: ShipmentUpdate, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(404, "Shipment not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(shipment, field, value)
    shipment.last_checked_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)
    return {"message": "Shipment updated"}


@app.get("/shipments")
def list_shipments(po_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Shipment)
    if po_id:
        query = query.filter(Shipment.purchase_order_id == po_id)
    return query.order_by(Shipment.created_at.desc()).all()


@app.post("/invoices")
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == payload.purchase_order_id).first()
    if not order:
        raise HTTPException(404, "Purchase order not found")
    invoice = Invoice(
        purchase_order_id=payload.purchase_order_id,
        invoice_number=payload.invoice_number,
        amount=payload.amount,
        currency=payload.currency,
        status=payload.status,
        due_date=payload.due_date,
        file_url=payload.file_url,
        notes=payload.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return {"message": "Invoice recorded", "id": str(invoice.id)}


@app.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: str, payload: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return {"message": "Invoice updated"}


@app.get("/invoices")
def list_invoices(po_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Invoice)
    if po_id:
        query = query.filter(Invoice.purchase_order_id == po_id)
    return query.order_by(Invoice.created_at.desc()).all()


@app.get("/profit")
def get_profit(db: Session = Depends(get_db)):
    orders = db.query(PurchaseOrder).all()
    total_revenue = sum(float((order.deal.value if order.deal else order.total_amount) or 0) for order in orders)
    total_landed_cost = sum(float(order.total_amount or 0) for order in orders)
    profit = total_revenue - total_landed_cost
    return {
        "total_revenue": total_revenue,
        "total_landed_cost": total_landed_cost,
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
        # Refresh token if needed
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(GoogleAuthRequest())
                user.gmail_access_token = creds.token
                # Google sometimes returns a new refresh token
                if creds.refresh_token and creds.refresh_token != user.gmail_refresh_token:
                    user.gmail_refresh_token = creds.refresh_token
                db.commit()
            except Exception as refresh_error:
                db.rollback()
                print(f"❌ Gmail token refresh failed for {user_email}: {refresh_error}")
                raise HTTPException(
                    401,
                    "Gmail session expired. Please reconnect your Gmail account.",
                ) from refresh_error

        service = build("gmail", "v1", credentials=creds)
        message = MIMEText(payload["body"])
        message["to"] = payload["to"]
        message["subject"] = payload["subject"]

        raw = {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}
        service.users().messages().send(userId="me", body=raw).execute()
        return {"message": f"Email sent via {user_email}"}
    except HttpError as gmail_error:
        error_reason = getattr(gmail_error, "error_details", gmail_error)
        print(f"❌ Gmail API error for {user_email}: {error_reason}")
        raise HTTPException(
            status_code=gmail_error.resp.status if gmail_error.resp else 500,
            detail="Gmail API error: "
            + (gmail_error.error_details[0]["message"] if getattr(gmail_error, "error_details", None) else str(gmail_error)),
        )
    except Exception as e:
        print(f"❌ Unexpected Gmail send failure for {user_email}: {e}")
        raise HTTPException(500, detail=str(e))
