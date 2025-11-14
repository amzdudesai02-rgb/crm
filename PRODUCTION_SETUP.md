# Production Setup Checklist for Leverage CRM

## ✅ Your Deployment URLs

- **Frontend (Vercel):** https://crm-kappa-pied.vercel.app
- **Backend (Render):** https://crm-o52e.onrender.com

---

## 🔧 Step 1: Update Render Environment Variables

Go to your Render dashboard → Your backend service → Environment

Add/Update these variables:

```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/dbname?sslmode=require
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://crm-kappa-pied.vercel.app
BACKEND_URL=https://crm-o52e.onrender.com
SECRET_KEY=generate-a-random-secret-key-here
OPENAI_API_KEY=your-openai-key (optional)
```

**Important:** After updating env vars, Render will automatically redeploy.

---

## 🔧 Step 2: Update Vercel Environment Variables

Go to your Vercel dashboard → Your project → Settings → Environment Variables

Add/Update:

```env
VITE_API_BASE_URL=https://crm-o52e.onrender.com
```

**Important:** After updating, trigger a new deployment (or push a commit).

---

## 🔧 Step 3: Update Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Your OAuth 2.0 Client ID

### Authorized JavaScript Origins
Add:
```
https://crm-kappa-pied.vercel.app
```

Keep existing localhost URLs for local development:
```
http://localhost:5173
http://127.0.0.1:5173
```

### Authorized Redirect URIs
Add:
```
https://crm-o52e.onrender.com/auth/google
```

Keep existing localhost URLs for local development:
```
http://127.0.0.1:8000/auth/google
http://localhost:8000/auth/google
```

**Important:** Wait 5-10 minutes after saving for changes to propagate.

---

## ✅ Step 4: Verify Deployment

### Test Backend
Visit: https://crm-o52e.onrender.com
Should see: `{"message": "Leverage CRM backend is running 🚀"}`

### Test OAuth Debug
Visit: https://crm-o52e.onrender.com/debug/oauth
Should show your OAuth configuration

### Test Frontend
Visit: https://crm-kappa-pied.vercel.app
Should load your React app

### Test Google Login
1. Go to https://crm-kappa-pied.vercel.app
2. Click "Sign Up" or "Login"
3. Click "Continue with Google"
4. Should redirect to Google OAuth
5. After authorization, should redirect back and log you in

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Fix:** Make sure `https://crm-kappa-pied.vercel.app` is in backend CORS settings (already added in code)

### Issue: OAuth Redirect URI Mismatch
**Fix:** 
- Double-check Google Cloud Console has `https://crm-o52e.onrender.com/auth/google`
- Wait 5-10 minutes after updating
- Check Render logs to see what redirect_uri is being used

### Issue: Backend Not Responding
**Fix:**
- Check Render dashboard for errors
- Verify environment variables are set correctly
- Check if service is sleeping (free tier sleeps after 15 min)

### Issue: Frontend Can't Connect to Backend
**Fix:**
- Verify `VITE_API_BASE_URL=https://crm-o52e.onrender.com` in Vercel
- Check browser console for CORS errors
- Verify backend CORS includes Vercel URL

---

## 📝 Local Development (Still Works!)

Your local setup will still work. Just use different env vars:

### Backend `.env` (local)
```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/dbname?sslmode=require
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://127.0.0.1:8000
SECRET_KEY=local-dev-secret
OPENAI_API_KEY=your-openai-key
```

### Frontend `.env.local` (local)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🎯 Next Steps

1. ✅ Test Google OAuth login on production
2. ✅ Test user registration
3. ✅ Test database operations
4. ✅ Monitor Render logs for any errors
5. ✅ Set up custom domain (optional)

---

## 💡 Pro Tips

1. **Render Free Tier:** Service sleeps after 15 min inactivity. First request after sleep will be slow (~30 seconds)
2. **Vercel:** Auto-deploys on every push to main branch
3. **Google OAuth:** Changes in Google Console take 5-10 minutes to propagate
4. **Environment Variables:** Always update in both Render and Vercel dashboards
5. **Logs:** Check Render logs if OAuth fails - they show detailed error messages

---

Your production setup is ready! 🚀

