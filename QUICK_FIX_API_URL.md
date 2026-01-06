# 🔧 Quick Fix: API Connection Error

## Problem
Frontend is trying to connect to `https://api.crm.amzdudes.io` but the backend isn't accessible at that URL yet.

## Solution Options

### Option 1: Use Existing Render URL (Temporary Fix)

If you have a Render backend already running, use that URL temporarily:

1. **Find your Render backend URL:**
   - Go to Render Dashboard
   - Find your backend service
   - Copy the URL (e.g., `https://crm-o52e.onrender.com`)

2. **Update Vercel Environment Variable:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `VITE_API_BASE_URL` to your Render URL:
     ```
     VITE_API_BASE_URL=https://your-render-service.onrender.com
     ```
   - Redeploy

3. **Update Backend CORS (if needed):**
   - The backend already includes `https://crm.amzdudes.io` in CORS
   - Restart backend if you just added it

---

### Option 2: Set Up Custom Domain `api.crm.amzdudes.io` (Permanent Fix)

#### Step 1: Add Domain in Render
1. Go to Render Dashboard → Your Backend Service
2. Go to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `api.crm.amzdudes.io`
5. Copy the CNAME target that Render provides

#### Step 2: Add DNS Record in Hostinger
1. Go to Hostinger → DNS Management
2. Add CNAME record:
   - **Type**: `CNAME`
   - **Name**: `api.crm`
   - **Points to**: [Render CNAME target from Step 1]
   - **TTL**: 14400

#### Step 3: Wait for DNS Propagation
- Wait 5-30 minutes for DNS to propagate
- Render will automatically issue SSL certificate

#### Step 4: Update Environment Variables
1. **Vercel**: Set `VITE_API_BASE_URL=https://api.crm.amzdudes.io`
2. **Render**: Set `BACKEND_URL=https://api.crm.amzdudes.io`
3. Redeploy both services

---

## Which Option Should You Use?

- **Use Option 1** if you want to test immediately
- **Use Option 2** if you want the proper custom domain setup

---

## Test After Fix

1. Visit `https://crm.amzdudes.io`
2. Open browser console (F12)
3. Check: `🔗 API Base URL: ...` should show your backend URL
4. Try login - should work!


