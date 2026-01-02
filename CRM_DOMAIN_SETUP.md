# 🚀 CRM Domain Setup: crm.amzdudes.io

## ✅ Current Configuration

- **Frontend**: `https://crm.amzdudes.io`
- **Backend API**: `https://api.crm.amzdudes.io` (if using subdomain) OR same domain

---

## 🔧 Required Configuration

### 1. Vercel (Frontend)

**Environment Variable:**
```
VITE_API_BASE_URL=https://api.crm.amzdudes.io
```

**Steps:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update `VITE_API_BASE_URL` to `https://api.crm.amzdudes.io`
3. **Redeploy** the project

---

### 2. Render (Backend)

**Environment Variables:**
```
FRONTEND_URL=https://crm.amzdudes.io
BACKEND_URL=https://api.crm.amzdudes.io
```

**Steps:**
1. Go to Render Dashboard → Your Service → Environment
2. Update `FRONTEND_URL` to `https://crm.amzdudes.io`
3. Update `BACKEND_URL` to `https://api.crm.amzdudes.io`
4. Restart the service

**Custom Domain:**
- Add `api.crm.amzdudes.io` in Render → Custom Domains
- Wait for verification

---

### 3. Hostinger DNS

**CNAME Records:**

1. **Frontend** (`crm.amzdudes.io`):
   - **Type**: `CNAME`
   - **Name**: `crm`
   - **Points to**: [Vercel CNAME target]
   - **TTL**: 300

2. **Backend** (`api.crm.amzdudes.io`):
   - **Type**: `CNAME`
   - **Name**: `api.crm`
   - **Points to**: [Render service URL, e.g., `your-service.onrender.com`]
   - **TTL**: 14400

---

### 4. Google Cloud Console

**Authorized JavaScript Origins:**
```
https://crm.amzdudes.io
```

**Authorized Redirect URIs:**
```
https://api.crm.amzdudes.io/auth/google
https://api.crm.amzdudes.io/auth/gmail/callback
```

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add the URLs above
5. Save

---

## ✅ Backend CORS Configuration

The backend `app.py` now includes:
```python
frontend_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://crm-kappa-pied.vercel.app",
    "https://leveragecrm.amzdudes.io",  # Old domain (kept for compatibility)
    "https://crm.amzdudes.io",          # New domain ✅
]
```

---

## 🧪 Testing

1. **Frontend**: Visit `https://crm.amzdudes.io`
   - Should load without errors
   - Check browser console (F12) for API URL

2. **Backend**: Visit `https://api.crm.amzdudes.io/docs`
   - Should show FastAPI documentation

3. **Login**: Try logging in
   - Should redirect correctly
   - Dashboard should load

---

## 🔍 Troubleshooting

### Dashboard Not Loading
- Check browser console (F12) for errors
- Verify `VITE_API_BASE_URL` is set in Vercel
- Check CORS errors - verify backend CORS includes `https://crm.amzdudes.io`

### CORS Errors
- Verify backend CORS in `backend/app.py` includes `https://crm.amzdudes.io`
- Restart/redeploy backend after CORS changes

### API Not Responding
- Check if `api.crm.amzdudes.io` DNS is pointing to Render
- Verify Render service is running
- Check Render logs for errors

---

## 📝 Quick Checklist

- [ ] `VITE_API_BASE_URL` set in Vercel → `https://api.crm.amzdudes.io`
- [ ] Vercel project redeployed
- [ ] `FRONTEND_URL` set in Render → `https://crm.amzdudes.io`
- [ ] `BACKEND_URL` set in Render → `https://api.crm.amzdudes.io`
- [ ] `api.crm.amzdudes.io` added as custom domain in Render
- [ ] DNS CNAME records added in Hostinger
- [ ] Google OAuth redirect URIs updated
- [ ] Backend CORS includes `https://crm.amzdudes.io`
- [ ] Backend service restarted/redeployed

---

**Your CRM is now configured for `crm.amzdudes.io`! 🎉**

