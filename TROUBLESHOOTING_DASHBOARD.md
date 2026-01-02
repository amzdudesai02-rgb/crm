# 🔧 Dashboard Not Opening - Troubleshooting Guide

## Common Issues & Solutions

### 1. **API URL Not Configured**

**Symptom**: Dashboard shows "Loading..." forever or connection error

**Check**: Open browser console (F12) and look for:
```
🔗 API Base URL: http://127.0.0.1:8000
```

If you see `http://127.0.0.1:8000` instead of `https://api.leveragecrm.amzdudes.io`, the environment variable is not set.

**Fix**:
1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add/Update: `VITE_API_BASE_URL=https://api.leveragecrm.amzdudes.io`
3. **Redeploy** the project (Vercel → Deployments → Redeploy)

---

### 2. **CORS Error**

**Symptom**: Browser console shows:
```
Access to XMLHttpRequest at 'https://api.leveragecrm.amzdudes.io/users/me' 
from origin 'https://leveragecrm.amzdudes.io' has been blocked by CORS policy
```

**Fix**:
1. Verify backend CORS includes your frontend domain
2. Check `backend/app.py` - should have:
   ```python
   frontend_origins = [
       "https://leveragecrm.amzdudes.io",
       # ... other origins
   ]
   ```
3. Restart/redeploy the backend on Render

---

### 3. **Backend Not Responding**

**Symptom**: Network error or timeout in console

**Check**:
1. Visit `https://api.leveragecrm.amzdudes.io/docs` - should show FastAPI docs
2. If it doesn't load, the backend domain is not configured correctly

**Fix**:
1. Go to **Render Dashboard → Your Service → Custom Domains**
2. Verify `api.leveragecrm.amzdudes.io` is added and verified
3. Check DNS in Hostinger - should have CNAME pointing to Render service

---

### 4. **Invalid/Expired Token**

**Symptom**: Dashboard redirects to login immediately

**Check**: Browser console shows:
```
Failed to fetch user: 401 Unauthorized
```

**Fix**:
1. Clear browser localStorage: `localStorage.clear()` in console
2. Login again
3. If still failing, check backend token validation

---

### 5. **Network/Firewall Issues**

**Symptom**: Connection timeout or network error

**Check**:
1. Test backend directly: `curl https://api.leveragecrm.amzdudes.io/docs`
2. Check if backend service is running on Render

**Fix**:
1. Restart the backend service on Render
2. Check Render logs for errors

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Open `https://leveragecrm.amzdudes.io`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for:
   - `🔗 API Base URL: ...` - Should show your backend URL
   - Any red error messages
   - Network errors

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Try to login
3. Look for requests to `/users/me` or other API endpoints
4. Check:
   - **Status**: Should be 200 (green) or 401 (yellow)
   - **URL**: Should point to `https://api.leveragecrm.amzdudes.io`
   - **CORS headers**: Check Response Headers for `Access-Control-Allow-Origin`

### Step 3: Test Backend Directly
1. Visit `https://api.leveragecrm.amzdudes.io/docs`
2. If it loads, backend is working
3. Try the `/users/me` endpoint with your token

### Step 4: Check Environment Variables
1. **Vercel**: Settings → Environment Variables
   - `VITE_API_BASE_URL` should be `https://api.leveragecrm.amzdudes.io`
2. **Render**: Environment tab
   - `FRONTEND_URL` should be `https://leveragecrm.amzdudes.io`
   - `BACKEND_URL` should be `https://api.leveragecrm.amzdudes.io`

---

## ✅ Quick Fix Checklist

- [ ] `VITE_API_BASE_URL` is set in Vercel
- [ ] Vercel project is redeployed after env var change
- [ ] Backend domain `api.leveragecrm.amzdudes.io` is verified in Render
- [ ] DNS CNAME records are correct in Hostinger
- [ ] Backend CORS includes `https://leveragecrm.amzdudes.io`
- [ ] Backend service is running on Render
- [ ] Browser console shows correct API URL
- [ ] No CORS errors in browser console

---

## 🆘 Still Not Working?

1. **Share the browser console errors** (screenshot or copy/paste)
2. **Check the Network tab** - what status codes are you seeing?
3. **Test the backend directly** - does `https://api.leveragecrm.amzdudes.io/docs` load?
4. **Verify environment variables** are set correctly in both Vercel and Render

The improved error messages should now show you exactly what's wrong! 🎯

