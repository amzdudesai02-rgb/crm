from sqlalchemy import (
    Column, String, Integer, DECIMAL, ForeignKey,
    Enum, Text, Date, TIMESTAMP, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
import uuid
from datetime import datetime


Base = declarative_base()

# 🧩 Roles
class Role(Base):
    __tablename__ = "roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)

# 🧩 Users
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))
    created_at = Column(TIMESTAMP)
    role = relationship("Role")
    gmail_access_token = Column(String, nullable=True)
    gmail_refresh_token = Column(String, nullable=True)


# 🧩 Companies
class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(Enum("brand", "supplier", name="company_type"))
    country = Column(String)
    website = Column(String)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP)
    creator = relationship("User")

# 🧩 Contacts
class Contact(Base):
    __tablename__ = "contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    position = Column(String)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP)
    company = relationship("Company")
    creator = relationship("User")

# 🧩 Interactions
class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    type = Column(Enum("email", "call", "meeting", "note", name="interaction_type"))
    details = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP)
    contact = relationship("Contact")
    creator = relationship("User")

# 🧩 Templates
class Template(Base):
    __tablename__ = "templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    body = Column(Text)
    type = Column(Enum("brand", "supplier", "followup", name="template_type"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    creator = relationship("User")

# 🧩 Outreach Campaigns
class OutreachCampaign(Base):
    __tablename__ = "outreach_campaigns"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"))
    status = Column(Enum("draft", "running", "completed", name="campaign_status"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP)
    template = relationship("Template")
    creator = relationship("User")

# 🧩 Purchase Orders
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    order_date = Column(Date)
    total_amount = Column(DECIMAL)
    status = Column(Enum("draft", "confirmed", "delivered", name="po_status"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP)
    company = relationship("Company")
    creator = relationship("User")

# 🧩 Order Items
class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"))
    product_name = Column(String)
    quantity = Column(Integer)
    unit_cost = Column(DECIMAL)
    total_cost = Column(DECIMAL)
    purchase_order = relationship("PurchaseOrder")

# 🧩 Transactions
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"))
    type = Column(Enum("revenue", "expense", name="transaction_type"))
    amount = Column(DECIMAL)
    profit = Column(DECIMAL)
    created_at = Column(TIMESTAMP)
    purchase_order = relationship("PurchaseOrder")

# 🧩 Amazon Accounts
class AmazonAccount(Base):
    __tablename__ = "amazon_accounts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    seller_id = Column(String)
    refresh_token = Column(Text)
    region = Column(String)
    created_at = Column(TIMESTAMP)
    user = relationship("User")

# 🧩 Amazon Data
class AmazonData(Base):
    __tablename__ = "amazon_data"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amazon_account_id = Column(UUID(as_uuid=True), ForeignKey("amazon_accounts.id"))
    sku = Column(String)
    sales = Column(DECIMAL)
    refunds = Column(DECIMAL)
    stock = Column(Integer)
    synced_at = Column(TIMESTAMP)
    account = relationship("AmazonAccount")

# 🧩 Activity Logs
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String)
    entity = Column(String)
    entity_id = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP)
    user = relationship("User")
# --- Pipeline / Deals ---
class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

# --- Pipeline / Deals ---
class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    value = Column(DECIMAL, default=0)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_stages.id"), nullable=False)
    position = Column(Integer, default=0)  # order within the stage
    due_date = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

    company = relationship("Company")
    contact = relationship("Contact")

# --- Notes / Activity Logs ---
class Note(Base):
    __tablename__ = "notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(String, nullable=False)
    related_type = Column(String, nullable=False)  # e.g. 'deal', 'contact', 'company'
    related_id = Column(UUID(as_uuid=True), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# --- Reminders ---
class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    related_type = Column(String, nullable=False)  # e.g. 'deal', 'contact'
    related_id = Column(UUID(as_uuid=True), nullable=False)
    due_date = Column(TIMESTAMP, nullable=False)
    completed = Column(Integer, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# --- Communication Logs (Calls / Emails) ---
class InteractionLog(Base):
    __tablename__ = "interaction_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)  # 'call' | 'email'
    subject = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    related_type = Column(String, nullable=False)
    related_id = Column(UUID(as_uuid=True), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

# --- Tag System ---
class Tag(Base):
    __tablename__ = "tags"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#6366f1")  # optional color
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class TagLink(Base):
    __tablename__ = "tag_links"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"))
    related_type = Column(String, nullable=False)  # e.g. deal, contact, company
    related_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    tag = relationship("Tag")
