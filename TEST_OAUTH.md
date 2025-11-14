# OAuth Testing & Debugging Guide

## 🔍 Step 1: Check Backend OAuth Configuration

Visit: `https://crm-o52e.onrender.com/debug/oauth`

**Expected output:**
```json
{
  "google_client_id_set": true,
  "google_client_secret_set": true,
  "google_client_id_preview": "926825213675-fu9nmth...",
  "frontend_url": "https://crm-kappa-pied.vercel.app",
  "redirect_uri": "https://crm-o52e.onrender.com/auth/google",
  "oauth_registered": true
}
```

**If `redirect_uri` shows `http://127.0.0.1:8000/auth/google`:**
- `BACKEND_URL` is not set in Render
- Fix: Set `BACKEND_URL=https://crm-o52e.onrender.com` in Render environment variables

---

## 🔍 Step 2: Check Render Logs During OAuth

1. Go to Render Dashboard → Your Service → Logs
2. Try OAuth login from frontend
3. Look for these log lines:

**When OAuth is initiated (`/login/google`):**
```
🔍 Initiating Google OAuth with redirect_uri: https://crm-o52e.onrender.com/auth/google
🔍 Request host: crm-o52e.onrender.com
🔍 BACKEND_URL env: https://crm-o52e.onrender.com
🔍 Detected production environment, using redirect_uri: https://crm-o52e.onrender.com/auth/google
```

**When callback is received (`/auth/google`):**
```
🔍 OAuth Callback - URL: https://crm-o52e.onrender.com/auth/google?code=...
🔧 Fixed request URL scheme: https://crm-o52e.onrender.com/auth/google?code=...
🔍 BEFORE token exchange:
   Request scheme: https
   Request URL: https://crm-o52e.onrender.com/auth/google?code=...
```

**If you see:**
```
⚠️  WARNING: Request URL still missing scheme after middleware!
```
→ The middleware isn't working properly

**If you see:**
```
❌ Failed to get access token:
   Error message: Request URL is missing an 'http://' or 'https://' protocol
```
→ authlib is still accessing the URL before our fix

---

## 🔍 Step 3: Verify Environment Variables

### In Render Dashboard:
- `BACKEND_URL=https://crm-o52e.onrender.com` ✅
- `FRONTEND_URL=https://crm-kappa-pied.vercel.app` ✅
- `GOOGLE_CLIENT_ID=...` ✅
- `GOOGLE_CLIENT_SECRET=...` ✅

### In Vercel Dashboard:
- `VITE_API_BASE_URL=https://crm-o52e.onrender.com` ✅

---

## 🐛 If Error Persists

The "Request URL is missing protocol" error means authlib is trying to construct a URL from `request.url` but it doesn't have a scheme.

**Possible causes:**
1. Middleware isn't running before authlib accesses the URL
2. Starlette's URL object is truly immutable and can't be patched
3. authlib accesses the URL in a way that bypasses our fix

**Next steps if still failing:**
1. Share the Render logs (especially the lines with 🔍 and 🔧)
2. We may need to manually handle the token exchange instead of using authlib's automatic method
3. Or switch to a different OAuth library that handles this better

---

## ✅ Quick Test

1. Visit: `https://crm-kappa-pied.vercel.app`
2. Click "Sign Up" or "Login"
3. Click "Continue with Google"
4. Should redirect to Google
5. After Google auth, should redirect back and log you in

If it fails, check Render logs immediately after the attempt.

