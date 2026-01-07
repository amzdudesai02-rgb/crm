# 🚀 How to Run Demo Setup Script

## Prerequisites

1. **Python 3.8+** installed
2. **Backend dependencies** installed
3. **Database connection** configured in `backend/.env`

---

## Step-by-Step Instructions

### Step 1: Install Backend Dependencies

Open PowerShell/Command Prompt and run:

```bash
cd backend
pip install -r requirements.txt
```

**Key packages needed:**
- `sqlalchemy` - Database ORM
- `psycopg2-binary` - PostgreSQL driver
- `passlib` - Password hashing
- `python-dotenv` - Environment variables

---

### Step 2: Verify Database Connection

Make sure `backend/.env` file exists and has:

```env
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
```

**To get your database URL:**
- If using Neon: Copy connection string from Neon dashboard
- If using local PostgreSQL: `postgresql://user:password@localhost:5432/dbname`

---

### Step 3: Run the Demo Setup Script

From the **project root** (`D:\LeverageCRM`), run:

```bash
python demo_setup.py
```

**Or if you have Python 3 specifically:**

```bash
python3 demo_setup.py
```

---

## Expected Output

You should see:

```
🚀 Starting demo data seeding...
============================================================

1. Creating demo user...
   ✅ Created demo user: no-reply@amzdudes.io

2. Setting up pipeline stages...
   ✅ Stage: prospecting
   ✅ Stage: qualification
   ✅ Stage: proposal
   ✅ Stage: negotiation
   ✅ Stage: won
   ✅ Stage: lost

3. Creating companies...
   ✅ Created 5 companies

4. Creating contacts...
   ✅ Created 5 contacts

5. Creating deals...
   ✅ Created 7 deals

6. Creating purchase orders...
   ✅ Created 3 purchase orders

7. Creating shipments...
   ✅ Created 2 shipments

8. Creating invoices...
   ✅ Created 2 invoices

9. Creating reminders...
   ✅ Created 3 reminders

10. Creating Amazon sales data...
   ✅ Created 5 Amazon SKU records

============================================================
✅ Demo data seeding completed successfully!
============================================================

📧 Login Credentials:
   Email: no-reply@amzdudes.io
   Password: Demo123!@#

🎯 Ready for CEO demo!
```

---

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'database'`

**Fix:**
```bash
# Make sure you're in project root, not backend folder
cd D:\LeverageCRM
python demo_setup.py
```

### Error: `DATABASE_URL not found`

**Fix:**
1. Check `backend/.env` file exists
2. Verify `DATABASE_URL` is set correctly
3. Make sure no extra quotes around the URL

### Error: `psycopg2` or database connection error

**Fix:**
```bash
cd backend
pip install psycopg2-binary
```

### Error: `passlib` not found

**Fix:**
```bash
cd backend
pip install passlib[bcrypt]
```

### Script runs but no data appears

**Fix:**
1. Check database connection is working
2. Verify you can connect to database
3. Check backend logs for errors
4. Try running script again (it updates existing data)

---

## Verify It Worked

After running the script:

1. **Start your backend** (if not running):
   ```bash
   cd backend
   uvicorn app:app --reload
   ```

2. **Start your frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login** at `http://localhost:5173`:
   - Email: `no-reply@amzdudes.io`
   - Password: `Demo123!@#`

4. **Check Dashboard** - You should see:
   - 7 deals
   - 5 contacts
   - 5 companies
   - $695,000 pipeline value

---

## Quick Command Reference

```bash
# Full setup (one-time)
cd backend
pip install -r requirements.txt
cd ..
python demo_setup.py

# Run demo setup (whenever you need fresh data)
python demo_setup.py

# Verify backend is running
cd backend
uvicorn app:app --reload

# Verify frontend is running
cd frontend
npm run dev
```

---

## Production Server

If running on production server (Render/Hostinger):

1. **SSH into server** (or use Render shell)
2. **Navigate to project directory**
3. **Run script**:
   ```bash
   python demo_setup.py
   ```
4. **Login** at your production URL with demo credentials

---

**That's it! You're ready for the demo! 🎯**

