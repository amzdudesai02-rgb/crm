# 🔧 Fix Network Error on Signup

## Problem
"Network Error" when trying to signup - frontend can't connect to backend API.

## Root Cause
The frontend is trying to connect to `http://127.0.0.1:8000` (localhost) but you're accessing the production site `crm.amzdudes.io`.

## Solution

### Step 1: Set Production API URL in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add/Update:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://api.crm.amzdudes.io` (or your Render backend URL)
   - **Environment**: Production, Preview, Development (all)
3. **Redeploy** the frontend

### Step 2: Verify Backend is Running

Check if your backend is accessible:
- **Render Backend**: Check Render dashboard - service should be "Live"
- **API URL**: Should be something like `https://your-backend.onrender.com` or `https://api.crm.amzdudes.io`

### Step 3: Check CORS Configuration

Make sure backend `app.py` has your frontend domain in CORS:

```python
frontend_origins = [
    "http://localhost:5173",
    "https://crm.amzdudes.io",  # ✅ Make sure this is here
    # ... other origins
]
```

### Step 4: Test API Connection

Open browser console on `crm.amzdudes.io` and check:
- Look for: `🔗 API Base URL: ...` in console
- It should show your production API URL, not `http://127.0.0.1:8000`

---

## Quick Fix Checklist

- [ ] Set `VITE_API_BASE_URL` in Vercel environment variables
- [ ] Redeploy frontend on Vercel
- [ ] Verify backend is running on Render
- [ ] Check CORS includes `https://crm.amzdudes.io`
- [ ] Test signup again

---

## Current API Configuration

**Frontend expects**: `VITE_API_BASE_URL` environment variable  
**Default fallback**: `http://127.0.0.1:8000` (localhost - won't work in production)

**Backend should be**: `https://api.crm.amzdudes.io` or your Render URL

---

## After Fix

Once `VITE_API_BASE_URL` is set correctly:
1. ✅ Frontend will connect to production backend
2. ✅ Signup will work
3. ✅ Login will work
4. ✅ All API calls will work

