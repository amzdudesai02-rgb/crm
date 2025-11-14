# How to Connect Backend to Neon PostgreSQL Database

## Step 1: Install Dependencies

Open PowerShell or Command Prompt in the `backend` directory and run:

```bash
cd backend
pip install -r requirements.txt
```

Or if you're using a virtual environment (recommended):

```bash
# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Then install dependencies
pip install -r requirements.txt
```

**Key package**: `psycopg2-binary` - This is the PostgreSQL adapter that allows Python to connect to Neon.

---

## Step 2: Verify Your .env File

Make sure your `backend/.env` file contains your Neon connection string:

```env
DATABASE_URL=postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Or** if Neon gave you a `postgres://` URL, that's fine - the code will automatically convert it.

**To get your Neon connection string:**
1. Go to your Neon dashboard
2. Select your project
3. Click on "Connection Details" or "Connection String"
4. Copy the connection string
5. Paste it in your `backend/.env` file as `DATABASE_URL=...`

---

## Step 3: Test the Connection

### Option A: Quick Python Test Script

Create a test file `backend/test_connection.py`:

```python
from database import engine, SessionLocal
from sqlalchemy import text

print("Testing Neon database connection...")

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"✅ Successfully connected to PostgreSQL!")
        print(f"   Database version: {version[:50]}...")
        
        # Test a simple query
        result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
        table_count = result.fetchone()[0]
        print(f"   Found {table_count} tables in the database")
        
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check your DATABASE_URL in .env file")
    print("2. Verify your Neon database is running")
    print("3. Check if your IP is whitelisted (if required)")
    print("4. Ensure SSL mode is set correctly")
```

Run it:
```bash
python test_connection.py
```

### Option B: Start the FastAPI Server

The connection will be tested automatically when you start the server:

```bash
# From backend directory
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ Successfully connected to database
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 4: Verify Tables Exist

Since you mentioned you already created tables in Neon using pgAdmin, you can verify they exist:

```python
from database import engine
from sqlalchemy import text, inspect

inspector = inspect(engine)
tables = inspector.get_table_names()

print(f"Found {len(tables)} tables:")
for table in tables:
    print(f"  - {table}")
```

Or check via pgAdmin or Neon dashboard.

---

## Step 5: Run Your Application

Start the FastAPI backend:

```bash
cd backend
uvicorn app:app --reload
```

The server will:
1. ✅ Test database connection on startup
2. ✅ Create any missing tables (if needed)
3. ✅ Start serving on http://localhost:8000

Visit http://localhost:8000 to see:
```json
{"message": "Leverage CRM backend is running 🚀"}
```

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"
- **Solution**: Make sure you have a `.env` file in the `backend/` directory with `DATABASE_URL=...`

### Error: "could not connect to server"
- **Solution**: 
  - Check your Neon connection string is correct
  - Verify your Neon database is running (check Neon dashboard)
  - Ensure your internet connection is working
  - Check if your IP needs to be whitelisted

### Error: "psycopg2" module not found
- **Solution**: Run `pip install psycopg2-binary`

### Error: "SSL connection required"
- **Solution**: The code automatically adds `sslmode=require`, but if you still get this error, manually add it to your connection string:
  ```
  DATABASE_URL=postgresql://...?sslmode=require
  ```

### Warning: "Could not connect to database"
- **Solution**: 
  - Double-check your connection string format
  - Make sure you're using the correct username/password
  - Verify the database name is correct
  - Check Neon dashboard for connection issues

---

## Connection String Format

Your Neon connection string should look like one of these:

```
# Format 1 (with SSL)
postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require

# Format 2 (will be auto-converted)
postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname

# Format 3 (with additional params)
postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require&connect_timeout=10
```

---

## What Happens on Startup

1. **Load .env file** → Reads `DATABASE_URL`
2. **Convert URL format** → `postgres://` → `postgresql://` (if needed)
3. **Add SSL mode** → Automatically adds `sslmode=require` if missing
4. **Create engine** → Sets up connection pooling for Neon
5. **Test connection** → Runs `SELECT 1` to verify connectivity
6. **Create tables** → `Base.metadata.create_all()` (safe if tables exist)

---

## Next Steps

Once connected:
- ✅ Your backend is ready to use
- ✅ All database operations will use Neon PostgreSQL
- ✅ Tables are automatically created if missing
- ✅ Connection pooling is optimized for serverless

You can now:
- Test API endpoints
- Create users, companies, deals, etc.
- All data will be stored in your Neon database!

