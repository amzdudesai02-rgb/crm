# ✅ Hostinger Deployment Checklist

Use this checklist to ensure everything is deployed correctly.

## Pre-Deployment

- [ ] Updated Google OAuth redirect URIs in Google Cloud Console
- [ ] Created subdomain `leveragecrm.amzdudes.io` in Hostinger
- [ ] Created subdomain `api.leveragecrm.amzdudes.io` in Hostinger (for backend)
- [ ] Have PostgreSQL database ready (connection string)
- [ ] Have all API keys ready (Google OAuth, OpenAI)

## Code Preparation

- [ ] Backend CORS updated (includes `https://leveragecrm.amzdudes.io`)
- [ ] Created `frontend/.env.production` with `VITE_API_BASE_URL`
- [ ] Built frontend (`npm run build` in `frontend/` folder)
- [ ] Tested frontend build locally (`npm run preview`)

## Frontend Deployment

- [ ] Uploaded all files from `frontend/dist/` to Hostinger subdomain folder
- [ ] Uploaded `frontend/.htaccess` file to subdomain root
- [ ] Verified `index.html` is in the root of subdomain folder
- [ ] Tested frontend URL: `https://leveragecrm.amzdudes.io`

## Backend Deployment (VPS)

- [ ] SSH access to VPS confirmed
- [ ] Python 3.10+ installed
- [ ] Backend files uploaded to `/var/www/leveragecrm-api`
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with all variables
- [ ] Systemd service file installed and enabled
- [ ] Backend service is running (`sudo systemctl status leveragecrm-api`)
- [ ] Nginx configured and enabled
- [ ] SSL certificate installed for `api.leveragecrm.amzdudes.io`
- [ ] Tested backend URL: `https://api.leveragecrm.amzdudes.io/docs`

## Backend Deployment (Shared Hosting)

- [ ] Backend files uploaded via File Manager
- [ ] Python app created in Hostinger panel
- [ ] Startup command set: `uvicorn app:app --host 0.0.0.0 --port 8000`
- [ ] Environment variables added in Hostinger panel
- [ ] Subdomain `api.leveragecrm.amzdudes.io` points to Python app

## Database

- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` in backend `.env` is correct
- [ ] Database connection tested
- [ ] Tables created (automatic on first startup)

## Testing

- [ ] Frontend loads at `https://leveragecrm.amzdudes.io`
- [ ] Backend API docs load at `https://api.leveragecrm.amzdudes.io/docs`
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can login with Google OAuth
- [ ] Can connect Gmail account
- [ ] Can generate AI email
- [ ] Can send email via Gmail
- [ ] Dashboard loads with data
- [ ] All navigation links work
- [ ] No CORS errors in browser console
- [ ] No 404 errors for routes

## Post-Deployment

- [ ] SSL certificates active for both subdomains
- [ ] Backend logs checked (no errors)
- [ ] Frontend console checked (no errors)
- [ ] Performance tested (page load times)
- [ ] Mobile responsiveness tested

## Security

- [ ] `SECRET_KEY` in backend `.env` is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in frontend code
- [ ] `.env` files are not uploaded to public folders
- [ ] File permissions set correctly (backend files not world-readable)

---

**🎉 Once all items are checked, your CRM is fully deployed!**

