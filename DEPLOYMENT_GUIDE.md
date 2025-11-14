# Deployment Guide for Leverage CRM

## Why Deploy First?

OAuth can be more reliable in production because:
- ✅ HTTPS URLs work better with OAuth providers
- ✅ Stable URLs (no localhost issues)
- ✅ Better session handling
- ✅ Easier to test with real URLs

---

## 🚀 Quick Deployment Steps

### Backend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up/login

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo (or deploy from Git)
   - Or use "Public Git repository" and paste your repo URL

3. **Configure Backend**
   ```
   Name: leverage-crm-backend
   Environment: Python 3
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

4. **Set Environment Variables in Render**
   ```
   DATABASE_URL=your-neon-postgresql-url
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=https://your-frontend.vercel.app
   OPENAI_API_KEY=your-openai-key (optional)
   SECRET_KEY=generate-a-random-secret-key
   ```

5. **Get Your Backend URL**
   - Render will give you: `https://leverage-crm-backend.onrender.com`
   - Note this URL!

---

### Frontend on Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up/login with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repo
   - Select the `frontend` folder as root directory

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Set Environment Variables in Vercel**
   ```
   VITE_API_BASE_URL=https://leverage-crm-backend.onrender.com
   ```

5. **Get Your Frontend URL**
   - Vercel will give you: `https://leverage-crm.vercel.app`
   - Note this URL!

---

## 🔧 Update Google Cloud Console

After deployment, update your OAuth credentials:

### Authorized JavaScript Origins
Add your production frontend URLs:
```
https://leverage-crm.vercel.app
https://your-custom-domain.vercel.app (if you have one)
```

### Authorized Redirect URIs
Add your production backend callback URL:
```
https://leverage-crm-backend.onrender.com/auth/google
```

**Keep localhost URLs for local development:**
```
http://localhost:5173
http://127.0.0.1:5173
http://127.0.0.1:8000/auth/google
http://localhost:8000/auth/google
```

---

## 📝 Update Environment Variables

### Backend `.env` (on Render)
```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/dbname?sslmode=require
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://leverage-crm.vercel.app
SECRET_KEY=your-random-secret-key-here
OPENAI_API_KEY=your-openai-key
```

### Frontend `.env.production` (or Vercel env vars)
```env
VITE_API_BASE_URL=https://leverage-crm-backend.onrender.com
```

---

## ✅ Testing After Deployment

1. **Test Backend**
   - Visit: `https://leverage-crm-backend.onrender.com`
   - Should see: `{"message": "Leverage CRM backend is running 🚀"}`

2. **Test OAuth Debug**
   - Visit: `https://leverage-crm-backend.onrender.com/debug/oauth`
   - Should show OAuth configuration

3. **Test Frontend**
   - Visit: `https://leverage-crm.vercel.app`
   - Try Google login
   - Should work! 🎉

---

## 🔄 Keep Local Development Working

### Backend `.env` (local)
```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/dbname?sslmode=require
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
SECRET_KEY=local-dev-secret
OPENAI_API_KEY=your-openai-key
```

### Frontend `.env.local` (local)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🐛 Common Deployment Issues

### Issue: CORS Errors
**Fix:** Update backend CORS to include Vercel URL:
```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://leverage-crm.vercel.app",  # Add this
    "https://your-custom-domain.vercel.app",  # Add this if you have one
]
```

### Issue: Database Connection Fails
**Fix:** 
- Make sure `DATABASE_URL` in Render has `?sslmode=require`
- Check Neon allows connections from Render IPs

### Issue: OAuth Still Fails
**Fix:**
- Double-check Google Cloud Console has production URLs
- Wait 5-10 minutes after updating Google Console (changes propagate)
- Check backend logs in Render dashboard

---

## 📊 Render Free Tier Limits

- **Free tier:** 750 hours/month
- **Sleeps after 15 min inactivity** (first request will be slow)
- **Upgrade to paid** for always-on service

---

## 🎯 Next Steps After Deployment

1. ✅ Test Google OAuth login
2. ✅ Test user registration
3. ✅ Test database operations
4. ✅ Monitor Render logs for errors
5. ✅ Set up custom domain (optional)

---

## 💡 Pro Tips

1. **Use Render's Environment Groups** to share env vars across services
2. **Enable Auto-Deploy** so changes push automatically
3. **Set up Health Checks** in Render dashboard
4. **Monitor Logs** in both Render and Vercel dashboards
5. **Use Vercel's Preview Deployments** for testing before production

---

Good luck! 🚀

