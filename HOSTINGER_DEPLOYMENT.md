# 🚀 Hostinger Deployment Guide for leveragecrm.amzdudes.io

This guide will help you deploy your CRM application to Hostinger using the subdomain `leveragecrm.amzdudes.io`.

## 📋 Prerequisites

1. **Hostinger Account** with:
   - Domain `amzdudes.io` already configured
   - Subdomain `leveragecrm.amzdudes.io` created in Hostinger panel
   - **VPS/Cloud Hosting** plan (required for Python backend) OR **Shared Hosting** with Python support

2. **Access to:**
   - Hostinger File Manager or FTP/SFTP
   - Hostinger Control Panel (hPanel)
   - SSH access (if using VPS)

3. **Google Cloud Console:**
   - Update OAuth redirect URIs to include your new domain

---

## 🏗️ Architecture Overview

Your app has **two parts**:

1. **Frontend** (React/Vite) → Deploy to `leveragecrm.amzdudes.io`
2. **Backend** (FastAPI/Python) → Deploy to `api.leveragecrm.amzdudes.io` OR same domain with `/api` path

**Recommended Setup:**
- Frontend: `https://leveragecrm.amzdudes.io` (static files)
- Backend: `https://api.leveragecrm.amzdudes.io` (Python app)

---

## 📦 Step 1: Prepare Your Code

### 1.1 Update Backend CORS Configuration

The backend needs to allow requests from your new domain. Update `backend/app.py`:

```python
frontend_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://crm-kappa-pied.vercel.app",  # Keep for backup
    "https://leveragecrm.amzdudes.io",     # NEW: Your Hostinger domain
]
```

### 1.2 Update Frontend API URL

Create a `.env.production` file in `frontend/` directory:

```env
VITE_API_BASE_URL=https://api.leveragecrm.amzdudes.io
```

Or if using same domain:
```env
VITE_API_BASE_URL=https://leveragecrm.amzdudes.io/api
```

### 1.3 Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   - `https://api.leveragecrm.amzdudes.io/auth/google/callback`
   - `https://api.leveragecrm.amzdudes.io/auth/gmail/callback`
   - `https://leveragecrm.amzdudes.io/auth/callback` (if using frontend callback)

---

## 🎨 Step 2: Deploy Frontend (Static Files)

### Option A: Using Hostinger File Manager

1. **Build the frontend locally:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   This creates a `dist/` folder with production files.

2. **Upload to Hostinger:**
   - Log into Hostinger hPanel
   - Go to **File Manager**
   - Navigate to `public_html/leveragecrm/` (or your subdomain folder)
   - Upload **ALL contents** of `frontend/dist/` folder
   - Make sure `index.html` is in the root of the subdomain folder

3. **Create `.htaccess` file** (for React Router):
   Create a file named `.htaccess` in your subdomain root with:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Option B: Using FTP/SFTP

1. Build frontend (same as above)
2. Use FileZilla or similar FTP client
3. Connect to Hostinger FTP
4. Upload `dist/` contents to subdomain folder

---

## 🐍 Step 3: Deploy Backend (Python/FastAPI)

### Option A: VPS/Cloud Hosting (Recommended)

If you have VPS access:

1. **SSH into your VPS:**
   ```bash
   ssh username@your-vps-ip
   ```

2. **Install Python 3.10+ and dependencies:**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx
   ```

3. **Create project directory:**
   ```bash
   mkdir -p /var/www/leveragecrm-api
   cd /var/www/leveragecrm-api
   ```

4. **Upload backend files:**
   - Use SFTP or `git clone` to upload your `backend/` folder
   - Make sure `requirements.txt` is included

5. **Set up Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

6. **Create `.env` file:**
   ```bash
   nano .env
   ```
   Add all your environment variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SECRET_KEY=your_secret_key_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=https://leveragecrm.amzdudes.io
   BACKEND_URL=https://api.leveragecrm.amzdudes.io
   OPENAI_API_KEY=your_openai_key
   ```

7. **Create systemd service:**
   ```bash
   sudo nano /etc/systemd/system/leveragecrm-api.service
   ```
   Add:
   ```ini
   [Unit]
   Description=LeverageCRM API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/leveragecrm-api
   Environment="PATH=/var/www/leveragecrm-api/venv/bin"
   ExecStart=/var/www/leveragecrm-api/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

8. **Start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable leveragecrm-api
   sudo systemctl start leveragecrm-api
   sudo systemctl status leveragecrm-api
   ```

9. **Configure Nginx reverse proxy:**
   ```bash
   sudo nano /etc/nginx/sites-available/leveragecrm-api
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name api.leveragecrm.amzdudes.io;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

10. **Enable site and restart Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/leveragecrm-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Set up SSL (Let's Encrypt):**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.leveragecrm.amzdudes.io
    ```

### Option B: Shared Hosting with Python Support

If Hostinger supports Python apps:

1. **Upload backend files** via File Manager to a folder like `api/`
2. **Set up Python app** in Hostinger panel:
   - Go to **Python App** section
   - Create new app
   - Point to your `backend/` folder
   - Set startup command: `uvicorn app:app --host 0.0.0.0 --port 8000`
   - Add environment variables in Hostinger panel

3. **Configure subdomain:**
   - Point `api.leveragecrm.amzdudes.io` to your Python app folder

---

## 🔧 Step 4: Configure Database

1. **Set up PostgreSQL:**
   - Use Hostinger's PostgreSQL service OR
   - Use external service (Neon, Supabase, etc.)

2. **Update `DATABASE_URL` in backend `.env`:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. **Run migrations:**
   The app creates tables automatically on startup, but you can verify:
   ```bash
   # SSH into VPS
   cd /var/www/leveragecrm-api
   source venv/bin/activate
   python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
   ```

---

## ✅ Step 5: Final Configuration

### 5.1 Update Environment Variables

**Backend `.env`:**
```env
DATABASE_URL=your_postgresql_url
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://leveragecrm.amzdudes.io
BACKEND_URL=https://api.leveragecrm.amzdudes.io
OPENAI_API_KEY=your_openai_key
```

**Frontend `.env.production`:**
```env
VITE_API_BASE_URL=https://api.leveragecrm.amzdudes.io
```

### 5.2 Test the Deployment

1. **Frontend:** Visit `https://leveragecrm.amzdudes.io`
2. **Backend:** Visit `https://api.leveragecrm.amzdudes.io/docs` (FastAPI docs)
3. **Test login/signup**
4. **Test Gmail connection**

---

## 🔒 Step 6: SSL Certificate

Hostinger usually provides free SSL via Let's Encrypt:

1. Go to **SSL** section in hPanel
2. Enable SSL for both:
   - `leveragecrm.amzdudes.io`
   - `api.leveragecrm.amzdudes.io`
3. Wait for activation (usually 5-10 minutes)

---

## 🐛 Troubleshooting

### Frontend shows blank page:
- Check browser console for errors
- Verify `.htaccess` file exists and has correct rewrite rules
- Check that `index.html` is in the root folder

### Backend not responding:
- Check if service is running: `sudo systemctl status leveragecrm-api`
- Check logs: `sudo journalctl -u leveragecrm-api -f`
- Verify Nginx config: `sudo nginx -t`
- Check firewall: `sudo ufw allow 8000`

### CORS errors:
- Verify `frontend_origins` in `backend/app.py` includes your domain
- Check that `FRONTEND_URL` in backend `.env` matches your frontend URL

### Database connection errors:
- Verify `DATABASE_URL` is correct
- Check if database allows connections from your server IP
- Test connection: `psql $DATABASE_URL`

---

## 📝 Quick Checklist

- [ ] Updated CORS in `backend/app.py`
- [ ] Created `frontend/.env.production` with API URL
- [ ] Updated Google OAuth redirect URIs
- [ ] Built frontend (`npm run build`)
- [ ] Uploaded frontend `dist/` to Hostinger
- [ ] Created `.htaccess` for React Router
- [ ] Deployed backend (VPS or Python app)
- [ ] Created `.env` file for backend
- [ ] Set up systemd service (if VPS)
- [ ] Configured Nginx reverse proxy (if VPS)
- [ ] Set up SSL certificates
- [ ] Tested login/signup
- [ ] Tested Gmail connection
- [ ] Verified database connection

---

## 🆘 Need Help?

If you encounter issues:
1. Check Hostinger documentation
2. Review backend logs: `sudo journalctl -u leveragecrm-api -f`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**🎉 Once deployed, your CRM will be live at `https://leveragecrm.amzdudes.io`!**

