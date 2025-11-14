# OAuth Debug Checklist

## ✅ Verify These Settings Match:

### 1. Google Cloud Console
- **Authorized JavaScript Origins:**
  - `https://crm-kappa-pied.vercel.app` ✅
  - `http://localhost:5173` (for local dev)
  - `http://127.0.0.1:5173` (for local dev)

- **Authorized Redirect URIs:**
  - `https://crm-o52e.onrender.com/auth/google` ✅ (MUST match exactly)
  - `http://127.0.0.1:8000/auth/google` (for local dev)
  - `http://localhost:8000/auth/google` (for local dev)

### 2. Render Environment Variables
Check in Render Dashboard → Your Service → Environment:
- `BACKEND_URL=https://crm-o52e.onrender.com` ✅
- `FRONTEND_URL=https://crm-kappa-pied.vercel.app` ✅
- `GOOGLE_CLIENT_ID=your-client-id` ✅
- `GOOGLE_CLIENT_SECRET=your-client-secret` ✅

### 3. Vercel Environment Variables
Check in Vercel Dashboard → Your Project → Settings → Environment Variables:
- `VITE_API_BASE_URL=https://crm-o52e.onrender.com` ✅

### 4. Test the Flow

1. **Visit:** https://crm-kappa-pied.vercel.app
2. **Click:** "Sign Up" or "Login"
3. **Click:** "Continue with Google"
4. **Expected:** Should redirect to Google OAuth
5. **After Google auth:** Should redirect back to `https://crm-o52e.onrender.com/auth/google`
6. **Then:** Should redirect to frontend with token

## 🔍 Debug Endpoints

### Check Backend OAuth Config:
Visit: `https://crm-o52e.onrender.com/debug/oauth`

Should show:
```json
{
  "google_client_id_set": true,
  "google_client_secret_set": true,
  "frontend_url": "https://crm-kappa-pied.vercel.app",
  "redirect_uri": "https://crm-o52e.onrender.com/auth/google"
}
```

### Check Render Logs:
1. Go to Render Dashboard → Your Service → Logs
2. Look for lines starting with:
   - `🔍 Initiating Google OAuth with redirect_uri:`
   - `🔍 Detected production environment, using redirect_uri:`
   - `🔧 Fixed request URL scheme:`
   - `❌ Failed to get access token:`

## 🐛 Common Issues

### Issue: "Request URL is missing protocol"
**Cause:** authlib can't construct URLs from request object
**Fix:** Middleware should fix this, but check logs to see if it's working

### Issue: "Redirect URI mismatch"
**Cause:** Google Console redirect URI doesn't match what backend sends
**Fix:** Ensure exact match: `https://crm-o52e.onrender.com/auth/google`

### Issue: Still redirecting to localhost
**Cause:** Frontend hardcoded URLs (we fixed this)
**Fix:** Make sure `VITE_API_BASE_URL` is set in Vercel

## 📝 Next Steps

1. ✅ Verify all URLs match exactly (no typos)
2. ✅ Check Render logs during OAuth attempt
3. ✅ Test `/debug/oauth` endpoint
4. ✅ Verify environment variables are set correctly
5. ✅ Wait 5-10 minutes after Google Console changes

