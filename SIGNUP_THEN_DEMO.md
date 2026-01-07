# 📝 Signup First, Then Load Demo Data

## Step-by-Step Instructions

### Step 1: Signup with `no-reply@amzdudes.io`

1. **Go to your frontend** (localhost:5173 or production URL)
2. **Click "Signup"** button
3. **Fill in the form**:
   - **Name**: `Demo User` (or any name you prefer)
   - **Email**: `no-reply@amzdudes.io`
   - **Password**: Choose your own password (remember it!)
4. **Click "Create workspace"**
5. **You'll see**: "Signup successful! Please login."
6. **Login** with your new credentials

---

### Step 2: Run Demo Setup Script

After signing up and logging in once, run:

```bash
python demo_setup.py
```

**What happens:**
- ✅ Script finds your existing account (`no-reply@amzdudes.io`)
- ✅ Uses your existing account (won't change your password)
- ✅ Populates demo data (companies, contacts, deals, POs, etc.)
- ✅ All demo data will be linked to your account

---

### Step 3: Login and View Demo Data

1. **Logout** (if you're still logged in)
2. **Login** again with:
   - Email: `no-reply@amzdudes.io`
   - Password: **The password you chose during signup**
3. **Dashboard** will now show all demo data!

---

## Important Notes

### Password
- ✅ **Your password** from signup is preserved
- ✅ Script does NOT change your password
- ✅ Use the password you set during signup to login

### Demo Data
- ✅ All demo data (deals, contacts, companies, etc.) will be linked to your account
- ✅ You can edit/delete demo data as needed
- ✅ Run the script again anytime to refresh demo data

### If Account Already Exists
- ✅ Script will use existing account
- ✅ Won't create duplicate
- ✅ Just populates data

---

## Quick Command Summary

```bash
# 1. Signup via frontend (use no-reply@amzdudes.io)
# 2. Then run:
python demo_setup.py

# 3. Login with your signup password
```

---

## Troubleshooting

### "Email already registered" during signup
- **Fix**: Account already exists. Just login instead, then run `python demo_setup.py`

### Script says "Demo user already exists"
- **This is OK!** It means it found your account and will use it.

### Can't login after running script
- **Remember**: Script doesn't change your password
- Use the password you set during signup

---

**That's it! Signup first, then run the script! 🚀**

