# Render Environment Variables Setup

## ⚠️ CRITICAL: Set BACKEND_URL in Render

The OAuth redirect is failing because `BACKEND_URL` is not set in your Render environment variables.

## Steps to Fix:

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Click on your backend service: `crm-o52e` (or similar)

2. **Go to Environment Tab**
   - Click on "Environment" in the left sidebar

3. **Add/Update BACKEND_URL**
   - Click "Add Environment Variable"
   - Key: `BACKEND_URL`
   - Value: `https://crm-o52e.onrender.com`
   - Click "Save Changes"

4. **Verify All Environment Variables**
   Make sure you have ALL of these set:
   ```
   BACKEND_URL=https://crm-o52e.onrender.com
   FRONTEND_URL=https://crm-kappa-pied.vercel.app
   DATABASE_URL=postgresql://... (your Neon URL)
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   SECRET_KEY=your-secret-key
   ```

5. **Redeploy**
   - Render will automatically redeploy when you save environment variables
   - Wait for deployment to complete (usually 1-2 minutes)

6. **Test Again**
   - Visit: https://crm-kappa-pied.vercel.app
   - Try Google login
   - Should now redirect to: `https://crm-o52e.onrender.com/auth/google` ✅

## Why This Matters:

- Without `BACKEND_URL`, the code defaults to `http://127.0.0.1:8000`
- Google OAuth redirects to localhost instead of production
- The OAuth callback fails because it's trying to reach localhost

## After Setting BACKEND_URL:

The code will now:
1. ✅ Use `https://crm-o52e.onrender.com/auth/google` as redirect URI
2. ✅ Properly handle OAuth callbacks
3. ✅ Work in production! 🎉

---

**Note:** The code has been updated to auto-detect production URLs from request headers as a fallback, but setting `BACKEND_URL` explicitly is the recommended approach.

