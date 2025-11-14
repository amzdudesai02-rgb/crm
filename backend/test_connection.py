"""
Quick test script to verify Neon PostgreSQL connection.
Run this from the backend directory: python test_connection.py
"""
from database import engine, SessionLocal
from sqlalchemy import text, inspect

print("=" * 60)
print("Testing Neon PostgreSQL Database Connection")
print("=" * 60)
print()

try:
    # Test 1: Basic connection
    print("1. Testing basic connection...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"   ✅ Connected successfully!")
        print(f"   📊 PostgreSQL version: {version.split(',')[0]}")
    
    # Test 2: List tables
    print("\n2. Checking existing tables...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if tables:
        print(f"   ✅ Found {len(tables)} table(s):")
        for table in sorted(tables):
            # Get row count for each table
            try:
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    print(f"      • {table} ({count} rows)")
            except:
                print(f"      • {table}")
    else:
        print("   ⚠️  No tables found. Tables will be created on first run.")
    
    # Test 3: Test session
    print("\n3. Testing database session...")
    db = SessionLocal()
    try:
        # Just verify we can create a session
        print("   ✅ Database session created successfully")
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("✅ All connection tests passed!")
    print("=" * 60)
    print("\nYour backend is ready to connect to Neon PostgreSQL.")
    print("You can now start the FastAPI server with:")
    print("   uvicorn app:app --reload")
    
except Exception as e:
    print(f"\n❌ Connection test failed!")
    print(f"\nError: {e}")
    print("\n" + "=" * 60)
    print("Troubleshooting Steps:")
    print("=" * 60)
    print("1. Check your DATABASE_URL in backend/.env file")
    print("2. Verify the connection string format:")
    print("   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require")
    print("3. Ensure your Neon database is running (check Neon dashboard)")
    print("4. Verify your credentials are correct")
    print("5. Check your internet connection")
    print("6. Make sure psycopg2-binary is installed:")
    print("   pip install psycopg2-binary")
    print("=" * 60)

