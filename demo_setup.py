"""
Demo Data Seeder for Leverage CRM
Run this script to populate your database with realistic demo data for CEO presentation.

Usage:
    python demo_setup.py

Make sure your backend/.env has DATABASE_URL configured.
"""

import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal
from models import (
    User,
    Company,
    Contact,
    PipelineStage,
    Deal,
    PurchaseOrder,
    Shipment,
    Invoice,
    Reminder,
    Note,
    AmazonData,
    Template,
    Role,
)

# Demo user credentials
DEMO_USER_EMAIL = "no-reply@amzdudes.io"
DEMO_USER_PASSWORD = "Demo123!@#"
DEMO_USER_NAME = "Demo User"

# Sample data
COMPANIES = [
    {"name": "TechBrand Inc.", "type": "brand", "country": "USA", "website": "https://techbrand.com"},
    {"name": "Global Suppliers Ltd.", "type": "supplier", "country": "China", "website": "https://globalsuppliers.com"},
    {"name": "Premium Products Co.", "type": "brand", "country": "Germany", "website": "https://premiumproducts.de"},
    {"name": "Asia Manufacturing Hub", "type": "supplier", "country": "Vietnam", "website": "https://asiamfg.vn"},
    {"name": "EcoBrand Solutions", "type": "brand", "country": "Canada", "website": "https://ecobrand.ca"},
]

CONTACTS = [
    {"name": "Sarah Johnson", "email": "sarah@techbrand.com", "phone": "+1-555-0101", "position": "VP of Sales"},
    {"name": "Michael Chen", "email": "michael@globalsuppliers.com", "phone": "+86-138-0000-0000", "position": "Business Development Manager"},
    {"name": "Emma Schmidt", "email": "emma@premiumproducts.de", "phone": "+49-30-12345678", "position": "Wholesale Director"},
    {"name": "David Nguyen", "email": "david@asiamfg.vn", "phone": "+84-90-123-4567", "position": "Export Manager"},
    {"name": "Lisa Anderson", "email": "lisa@ecobrand.ca", "phone": "+1-555-0202", "position": "Partnership Manager"},
]

DEALS = [
    {"title": "TechBrand Q4 Wholesale Partnership", "value": 125000, "stage": "negotiation", "due_date_days": 5},
    {"title": "Global Suppliers Electronics Line", "value": 85000, "stage": "prospecting", "due_date_days": 12},
    {"title": "Premium Products Kitchen Collection", "value": 95000, "stage": "qualification", "due_date_days": 8},
    {"title": "Asia Manufacturing Home Goods", "value": 75000, "stage": "prospecting", "due_date_days": 15},
    {"title": "EcoBrand Sustainable Products", "value": 110000, "stage": "negotiation", "due_date_days": 3},
    {"title": "TechBrand Accessories Expansion", "value": 65000, "stage": "won", "due_date_days": -2},
    {"title": "Global Suppliers Q1 2024 Order", "value": 140000, "stage": "proposal", "due_date_days": 7},
]

PURCHASE_ORDERS = [
    {"reference": "PO-2024-001", "units_total": 500, "total_amount": 25000, "status": "ordered", "days_ago": 10},
    {"reference": "PO-2024-002", "units_total": 750, "total_amount": 37500, "status": "in_transit", "days_ago": 5},
    {"reference": "PO-2024-003", "units_total": 300, "total_amount": 15000, "status": "draft", "days_ago": 1},
]

SHIPMENTS = [
    {"carrier": "FedEx", "tracking_number": "FX1234567890", "status": "in_transit", "eta_days": 3},
    {"carrier": "DHL", "tracking_number": "DHL9876543210", "status": "in_transit", "eta_days": 7},
]

INVOICES = [
    {"invoice_number": "INV-2024-001", "amount": 25000, "status": "paid", "days_ago": 8},
    {"invoice_number": "INV-2024-002", "amount": 37500, "status": "pending", "days_ago": 2},
]

AMAZON_DATA = [
    {"sku": "TB-ELEC-001", "sales": 12500.00, "refunds": 250.00, "stock": 450},
    {"sku": "GP-HOME-002", "sales": 8900.00, "refunds": 120.00, "stock": 320},
    {"sku": "PP-KIT-003", "sales": 15200.00, "refunds": 180.00, "stock": 280},
    {"sku": "AM-DECOR-004", "sales": 6800.00, "refunds": 95.00, "stock": 150},
    {"sku": "EB-SUST-005", "sales": 11200.00, "refunds": 140.00, "stock": 210},
]

REMINDERS = [
    {"title": "Follow up with TechBrand", "description": "Send pricing proposal", "due_date_days": 2},
    {"title": "Review Global Suppliers contract", "description": "Legal review needed", "due_date_days": 4},
    {"title": "Call Premium Products", "description": "Discuss MOQ requirements", "due_date_days": 1},
]

# Password hashing is now done inline in seed_demo_data() using backend's function

def seed_demo_data():
    """Seed database with demo data"""
    db = SessionLocal()
    
    try:
        print("🚀 Starting demo data seeding...")
        print("=" * 60)
        
        # 1. Create or get demo user
        print("\n1. Creating demo user...")
        demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
        if not demo_user:
            # Use backend's hash_password function
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
            from app import hash_password as backend_hash_password
            
            # Check if admin role exists, create if not
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                admin_role = Role(id=uuid4(), name="admin")
                db.add(admin_role)
                db.commit()
            
            # Hash password using backend function
            try:
                hashed_pwd = backend_hash_password(DEMO_USER_PASSWORD)
            except Exception as e:
                print(f"   ⚠️ Password hashing issue: {e}")
                print(f"   💡 Try signing up via frontend instead, or use a shorter password")
                raise
            
            demo_user = User(
                id=uuid4(),
                email=DEMO_USER_EMAIL,
                name=DEMO_USER_NAME,
                password=hashed_pwd,
                role_id=admin_role.id,
                created_at=datetime.utcnow(),
            )
            db.add(demo_user)
            db.commit()
            print(f"   ✅ Created demo user: {DEMO_USER_EMAIL}")
        else:
            print(f"   ✅ Demo user already exists: {DEMO_USER_EMAIL}")
        
        db.refresh(demo_user)
        
        # 2. Create pipeline stages if they don't exist
        print("\n2. Setting up pipeline stages...")
        stage_names = ["prospecting", "qualification", "proposal", "negotiation", "won", "lost"]
        stage_map = {}
        
        for idx, stage_name in enumerate(stage_names):
            stage = db.query(PipelineStage).filter(PipelineStage.name == stage_name).first()
            if not stage:
                stage = PipelineStage(
                    id=uuid4(),
                    name=stage_name,
                    order_index=idx,
                    created_at=datetime.utcnow(),
                )
                db.add(stage)
                db.commit()
            stage_map[stage_name] = stage
            print(f"   ✅ Stage: {stage_name}")
        
        # 3. Create companies
        print("\n3. Creating companies...")
        company_map = {}
        for i, comp_data in enumerate(COMPANIES):
            company = Company(
                id=uuid4(),
                name=comp_data["name"],
                type=comp_data["type"],
                country=comp_data["country"],
                website=comp_data["website"],
                created_by=demo_user.id,
                created_at=datetime.utcnow(),
            )
            db.add(company)
            company_map[i] = company
        db.commit()
        print(f"   ✅ Created {len(COMPANIES)} companies")
        
        # 4. Create contacts
        print("\n4. Creating contacts...")
        contact_map = {}
        for i, contact_data in enumerate(CONTACTS):
            contact = Contact(
                id=uuid4(),
                name=contact_data["name"],
                email=contact_data["email"],
                phone=contact_data["phone"],
                position=contact_data["position"],
                company_id=company_map[i].id if i < len(company_map) else None,
                created_by=demo_user.id,
                created_at=datetime.utcnow(),
            )
            db.add(contact)
            contact_map[i] = contact
        db.commit()
        print(f"   ✅ Created {len(CONTACTS)} contacts")
        
        # 5. Create deals
        print("\n5. Creating deals...")
        for i, deal_data in enumerate(DEALS):
            stage = stage_map[deal_data["stage"]]
            due_date = datetime.utcnow() + timedelta(days=deal_data["due_date_days"])
            
            deal = Deal(
                id=uuid4(),
                title=deal_data["title"],
                value=deal_data["value"],
                company_id=company_map[i % len(company_map)].id,
                contact_id=contact_map[i % len(contact_map)].id,
                stage_id=stage.id,
                position=i,
                due_date=due_date,
                created_at=datetime.utcnow() - timedelta(days=30-i),
                updated_at=datetime.utcnow() - timedelta(days=30-i),
            )
            db.add(deal)
        db.commit()
        print(f"   ✅ Created {len(DEALS)} deals")
        
        # 6. Create purchase orders
        print("\n6. Creating purchase orders...")
        deals_list = db.query(Deal).filter(Deal.stage_id == stage_map["won"].id).limit(3).all()
        if not deals_list:
            # If no won deals, use any deals
            deals_list = db.query(Deal).limit(3).all()
        
        for i, po_data in enumerate(PURCHASE_ORDERS):
            if i < len(deals_list):
                company_id = deals_list[i].company_id or company_map[0].id
                po = PurchaseOrder(
                    id=uuid4(),
                    reference=po_data["reference"],
                    deal_id=deals_list[i].id if deals_list[i] else None,
                    company_id=company_id,
                    units_total=po_data["units_total"],
                    total_amount=po_data["total_amount"],
                    cogs_total=po_data["total_amount"] * 0.7,  # Estimate COGS
                    status=po_data["status"],
                    created_at=datetime.utcnow() - timedelta(days=po_data["days_ago"]),
                    expected_arrival_date=datetime.utcnow() + timedelta(days=po_data["days_ago"] + 5),
                    created_by=demo_user.id,
                )
                db.add(po)
        db.commit()
        print(f"   ✅ Created {len(PURCHASE_ORDERS)} purchase orders")
        
        # 7. Create shipments
        print("\n7. Creating shipments...")
        pos = db.query(PurchaseOrder).limit(2).all()
        for i, ship_data in enumerate(SHIPMENTS):
            if i < len(pos):
                shipment = Shipment(
                    id=uuid4(),
                    purchase_order_id=pos[i].id,
                    carrier=ship_data["carrier"],
                    tracking_number=ship_data["tracking_number"],
                    status=ship_data["status"],
                    eta=datetime.utcnow() + timedelta(days=ship_data["eta_days"]),
                    created_at=datetime.utcnow() - timedelta(days=5-i),
                )
                db.add(shipment)
        db.commit()
        print(f"   ✅ Created {len(SHIPMENTS)} shipments")
        
        # Refresh pos for invoices
        pos = db.query(PurchaseOrder).limit(2).all()
        
        # 8. Create invoices
        print("\n8. Creating invoices...")
        for i, inv_data in enumerate(INVOICES):
            status_map = {"paid": "paid", "pending": "issued"}  # Map to enum values
            invoice = Invoice(
                id=uuid4(),
                invoice_number=inv_data["invoice_number"],
                purchase_order_id=pos[i].id if i < len(pos) else None,
                amount=inv_data["amount"],
                status=status_map.get(inv_data["status"], "issued"),
                created_at=datetime.utcnow() - timedelta(days=inv_data["days_ago"]),
                due_date=(datetime.utcnow() + timedelta(days=30-inv_data["days_ago"])).date(),
            )
            db.add(invoice)
        db.commit()
        print(f"   ✅ Created {len(INVOICES)} invoices")
        
        # 9. Create reminders
        print("\n9. Creating reminders...")
        deals_for_reminders = db.query(Deal).limit(3).all()
        for i, rem_data in enumerate(REMINDERS):
            if i < len(deals_for_reminders):
                reminder = Reminder(
                    id=uuid4(),
                    related_type="deal",
                    related_id=deals_for_reminders[i].id,
                    title=rem_data["title"],
                    due_date=datetime.utcnow() + timedelta(days=rem_data["due_date_days"]),
                    created_by=demo_user.id,
                    created_at=datetime.utcnow(),
                )
                db.add(reminder)
        db.commit()
        print(f"   ✅ Created {len(REMINDERS)} reminders")
        
        # 10. Create Amazon data
        print("\n10. Creating Amazon sales data...")
        for amazon_data in AMAZON_DATA:
            amazon_record = AmazonData(
                id=uuid4(),
                amazon_account_id=None,
                sku=amazon_data["sku"],
                sales=amazon_data["sales"],
                refunds=amazon_data["refunds"],
                stock=amazon_data["stock"],
                synced_at=datetime.utcnow(),
            )
            db.add(amazon_record)
        db.commit()
        print(f"   ✅ Created {len(AMAZON_DATA)} Amazon SKU records")
        
        print("\n" + "=" * 60)
        print("✅ Demo data seeding completed successfully!")
        print("=" * 60)
        print(f"\n📧 Login Credentials:")
        print(f"   Email: {DEMO_USER_EMAIL}")
        print(f"   Password: {DEMO_USER_PASSWORD}")
        print(f"\n🎯 Ready for CEO demo!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding demo data: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()

