# 🔧 Setting Up api.crm.amzdudes.io

## ✅ Current Status

Your environment variables are correctly set:
- **Vercel**: `VITE_API_BASE_URL=https://api.crm.amzdudes.io` ✅
- **Render**: `BACKEND_URL=https://api.crm.amzdudes.io` ✅
- **Render**: `FRONTEND_URL=https://crm.amzdudes.io` ✅

**The problem**: The domain `api.crm.amzdudes.io` doesn't exist yet or isn't pointing to your Render backend.

---

## 🚀 Solution: Add Custom Domain in Render

### Step 1: Add Custom Domain in Render

1. Go to **Render Dashboard** → Your Backend Service
2. Click on **"Custom Domains"** tab (or look for it in Settings)
3. Click **"Add Custom Domain"** or **"Add"** button
4. Enter: `api.crm.amzdudes.io`
5. Click **"Add"** or **"Save"**

### Step 2: Get the CNAME Target

After adding the domain, Render will show you:
- A **CNAME target** (something like `your-service.onrender.com`)
- Or an **A record** (an IP address)

**Copy this value!** You'll need it for Hostinger DNS.

### Step 3: Add DNS Record in Hostinger

1. Go to **Hostinger** → **DNS Management** (or **Domain** → **DNS Zone Editor**)
2. Click **"Add Record"** or **"Add"**
3. Fill in:
   - **Type**: `CNAME` (or `A` if Render gave you an IP)
   - **Name**: `api.crm` (just the subdomain part)
   - **Points to**: [Paste the CNAME target from Render]
   - **TTL**: `14400` (or default)
4. Click **"Save"** or **"Add Record"**

### Step 4: Wait for DNS Propagation

- **Wait 5-30 minutes** for DNS to propagate
- Render will automatically detect the DNS record
- Render will automatically issue an SSL certificate (this may take a few more minutes)

### Step 5: Verify Domain in Render

1. Go back to Render → Custom Domains
2. Check the status of `api.crm.amzdudes.io`
3. It should show:
   - ✅ **"Verified"** (green checkmark)
   - ✅ **"SSL Certificate Active"** (if using HTTPS)

---

## 🧪 Test After Setup

1. **Test Backend Directly:**
   - Visit: `https://api.crm.amzdudes.io/docs`
   - Should show FastAPI documentation

2. **Test Frontend:**
   - Visit: `https://crm.amzdudes.io`
   - Open browser console (F12)
   - Should see: `🔗 API Base URL: https://api.crm.amzdudes.io`
   - Try login - should work!

---

## ⚠️ If You Don't Have Custom Domain Option in Render

If Render doesn't show a "Custom Domains" option, you might be on a free plan that doesn't support custom domains.

### Alternative: Use Render Service URL Temporarily

1. **Find your Render service URL:**
   - Go to Render Dashboard → Your Backend Service
   - Look at the top - it should show something like:
     - `https://your-service-name.onrender.com`
     - Or `https://your-service-name-xxxx.onrender.com`

2. **Update Vercel temporarily:**
   - Vercel → Environment Variables
   - Change `VITE_API_BASE_URL` to your Render service URL:
     ```
     VITE_API_BASE_URL=https://your-service-name.onrender.com
     ```
   - Redeploy

3. **Update Render temporarily:**
   - Render → Environment Variables
   - Change `BACKEND_URL` to your Render service URL:
     ```
     BACKEND_URL=https://your-service-name.onrender.com
     ```
   - Restart service

4. **Update Backend CORS:**
   - The backend already includes `https://crm.amzdudes.io` in CORS ✅
   - No changes needed

---

## 📋 Quick Checklist

- [ ] Added `api.crm.amzdudes.io` as custom domain in Render
- [ ] Copied CNAME target from Render
- [ ] Added CNAME record in Hostinger DNS
- [ ] Waited 5-30 minutes for DNS propagation
- [ ] Render shows domain as "Verified"
- [ ] SSL certificate is active
- [ ] Tested `https://api.crm.amzdudes.io/docs`
- [ ] Tested login on `https://crm.amzdudes.io`

---

**Once the domain is verified in Render, your login should work! 🎉**


