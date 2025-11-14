# Google OAuth Setup Guide for Leverage CRM

## ✅ Current Setup Status

Your Google OAuth is **correctly integrated** in the backend! Here's what's configured:

### Backend Configuration (✅ Already Set Up)

**File: `backend/app.py`**

- **Google OAuth Endpoints:**
  - Login: `GET /login/google` - Initiates Google OAuth flow
  - Callback: `GET /auth/google` - Handles Google OAuth callback
  - Redirect URI: `http://127.0.0.1:8000/auth/google`

- **Environment Variables Needed in `backend/.env`:**
  ```env
  GOOGLE_CLIENT_ID=your-client-id-here
  GOOGLE_CLIENT_SECRET=your-client-secret-here
  FRONTEND_URL=http://localhost:5173
  ```

- **Frontend Redirect:**
  After successful Google login, users are redirected to:
  `{FRONTEND_URL}/?token={access_token}`

---

## 📝 Frontend `.env.local` File

**File: `frontend/.env.local`** (✅ Already Created)

```env
# Backend API Base URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Note:** The frontend does NOT need Google Client ID/Secret because:
- OAuth flow happens entirely on the backend
- Frontend just redirects to `/login/google` endpoint
- Backend handles the OAuth and redirects back with a token

---

## 🔧 Google Cloud Console Configuration

You need to configure these settings in [Google Cloud Console](https://console.cloud.google.com/):

### Step 1: Go to APIs & Services → Credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (or create one if needed)

### Step 2: Configure Authorized JavaScript Origins

Add these **Authorized JavaScript origins**:

```
http://localhost:5173
http://127.0.0.1:5173
```

**Why?** These are the origins where your frontend runs (Vite dev server).

### Step 3: Configure Authorized Redirect URIs

Add this **Authorized redirect URI**:

```
http://127.0.0.1:8000/auth/google
```

**Why?** This is where Google redirects after authentication. Your backend handles the OAuth callback here.

### Step 4: Save Changes

Click **Save** and wait a few minutes for changes to propagate.

---

## 🔄 OAuth Flow Diagram

```
1. User clicks "Continue with Google" on frontend
   ↓
2. Frontend redirects to: http://127.0.0.1:8000/login/google
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User authorizes on Google
   ↓
5. Google redirects to: http://127.0.0.1:8000/auth/google?code=...
   ↓
6. Backend exchanges code for token, creates/updates user
   ↓
7. Backend redirects to: http://localhost:5173/?token={jwt_token}
   ↓
8. Frontend saves token to localStorage and redirects to /dashboard
```

---

## ✅ Verification Checklist

- [ ] `backend/.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] `frontend/.env.local` has `VITE_API_BASE_URL=http://127.0.0.1:8000`
- [ ] Google Cloud Console has `http://localhost:5173` in Authorized JavaScript origins
- [ ] Google Cloud Console has `http://127.0.0.1:5173` in Authorized JavaScript origins
- [ ] Google Cloud Console has `http://127.0.0.1:8000/auth/google` in Authorized redirect URIs
- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 5173

---

## 🧪 Testing the OAuth Flow

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn app:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Login:**
   - Go to http://localhost:5173/login
   - Click "Continue with Google"
   - You should be redirected to Google OAuth
   - After authorization, you should be redirected back to the dashboard

---

## 🐛 Common Issues & Fixes

### Issue: "redirect_uri_mismatch" Error

**Error:** `Error 400: redirect_uri_mismatch`

**Fix:** 
- Make sure `http://127.0.0.1:8000/auth/google` is EXACTLY in your Google Cloud Console redirect URIs
- No trailing slashes, exact match required
- Wait a few minutes after saving changes

### Issue: "Origin Mismatch" Error

**Error:** `Error 400: origin_mismatch`

**Fix:**
- Add both `http://localhost:5173` and `http://127.0.0.1:5173` to Authorized JavaScript origins
- Make sure there are no typos

### Issue: Frontend Can't Connect to Backend

**Fix:**
- Check `VITE_API_BASE_URL` in `frontend/.env.local`
- Make sure backend is running on port 8000
- Check CORS settings in `backend/app.py` (should allow `http://localhost:5173`)

### Issue: Token Not Saved

**Fix:**
- Check browser console for errors
- Verify the redirect URL includes `?token=...`
- Check `frontend/src/Login.jsx` handles token from URL params

---

## 📚 Additional Notes

### For Production Deployment

When deploying to production, update:

1. **Backend `.env`:**
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Google Cloud Console:**
   - Add production frontend URL to Authorized JavaScript origins
   - Add production backend callback URL to Authorized redirect URIs

3. **Frontend `.env.production`:**
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

### Gmail Integration (Separate OAuth Flow)

Your backend also has Gmail integration at `/auth/gmail/callback`. This uses the same Google Client ID/Secret but different scopes:
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`
- `openid`

If you use Gmail features, you may need to add:
```
http://127.0.0.1:8000/auth/gmail/callback
```
to your Authorized redirect URIs as well.

---

## ✅ Summary

**Frontend `.env.local` needs:**
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Google Cloud Console needs:**
- **Authorized JavaScript origins:**
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

- **Authorized redirect URIs:**
  - `http://127.0.0.1:8000/auth/google`

That's it! Your OAuth setup is complete. 🎉

