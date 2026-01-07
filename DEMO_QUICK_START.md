# 🚀 Quick Demo Setup Guide

## Step 1: Run Demo Data Seeder (2 minutes)

```bash
# Make sure you're in the project root
cd D:\LeverageCRM

# Run the demo setup script
python demo_setup.py
```

**What this does:**
- Creates demo user account
- Seeds 5 companies (brands & suppliers)
- Seeds 5 contacts
- Creates 7 deals across different pipeline stages
- Creates 3 purchase orders
- Creates 2 shipments
- Creates 2 invoices
- Creates 3 reminders
- Creates 5 Amazon SKU records

**Demo Login Credentials:**
- **Email**: `no-reply@amzdudes.io`
- **Password**: `Demo123!@#`

---

## Step 2: Verify Setup (1 minute)

1. **Start Backend** (if not running):
   ```bash
   cd backend
   uvicorn app:app --reload
   ```

2. **Start Frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login**:
   - Go to `http://localhost:5173`
   - Login with: `no-reply@amzdudes.io` / `Demo123!@#`
   - Verify dashboard shows data

---

## Step 3: Demo Checklist

Before the CEO demo, verify:

- [ ] Dashboard loads with metrics (7 deals, $695K pipeline value)
- [ ] Pipeline page shows Kanban board with deals
- [ ] Can drag deals between stages
- [ ] AI Outreach page loads templates
- [ ] Can generate an email (even if Gmail not connected)
- [ ] Operations page shows POs, shipments, invoices
- [ ] Intelligence page shows profit metrics
- [ ] Contacts and Companies tabs show data

---

## Step 4: Demo Flow (15-20 minutes)

Follow the **CEO_DEMO_GUIDE.md** for the complete presentation script.

**Quick Demo Flow:**
1. **Dashboard** (2 min) - Show overview and metrics
2. **Pipeline** (4 min) - Drag deals, create new deal, show timeline
3. **AI Outreach** (4 min) - Generate email, show templates
4. **Operations** (3 min) - Show POs, shipments, invoices
5. **Intelligence** (2 min) - Show profit analytics
6. **Q&A** (5 min)

---

## Troubleshooting

### Script Fails to Run
- **Error**: `ModuleNotFoundError`
  - **Fix**: Make sure you're in project root and backend dependencies are installed
  - Run: `cd backend && pip install -r requirements.txt`

### Demo User Already Exists
- **Fix**: The script will use existing user. If you want fresh data, delete the user from database first.

### No Data Shows After Login
- **Fix**: 
  1. Check backend is running
  2. Check database connection in `backend/.env`
  3. Run `python demo_setup.py` again
  4. Refresh frontend

### Gmail Not Connected
- **Note**: This is OK for demo. You can still show email generation. Just mention Gmail integration requires OAuth setup.

---

## Reset Demo Data

To reset and reseed demo data:

```bash
# Option 1: Just run the script again (it will update existing data)
python demo_setup.py

# Option 2: Delete demo user from database and rerun
# (You'll need database access for this)
```

---

## Production Demo

If demo is on production (`https://crm.amzdudes.io`):

1. **SSH into server** (or use Render dashboard)
2. **Run script** on server:
   ```bash
   python demo_setup.py
   ```
3. **Login** at `https://crm.amzdudes.io` with demo credentials

---

**Ready for demo! 🎯**

