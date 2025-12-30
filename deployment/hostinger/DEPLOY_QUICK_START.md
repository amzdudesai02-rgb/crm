# 🚀 Quick Start: Deploy to Hostinger

This is a condensed version of the full deployment guide. Follow these steps in order.

## Prerequisites Checklist
- [ ] Hostinger account with `amzdudes.io` domain
- [ ] Subdomain `leveragecrm.amzdudes.io` created in Hostinger
- [ ] Subdomain `api.leveragecrm.amzdudes.io` created (for backend)
- [ ] VPS/Cloud hosting plan (for Python backend) OR Python support on shared hosting
- [ ] PostgreSQL database (Hostinger or external)

---

## Step 1: Update Code (5 minutes)

### 1.1 Update CORS (Already done in code)
The backend `app.py` now includes `https://leveragecrm.amzdudes.io` in allowed origins.

### 1.2 Create Frontend Environment File
```bash
cd frontend
cp .env.production.example .env.production
```
Edit `.env.production`:
```env
VITE_API_BASE_URL=https://api.leveragecrm.amzdudes.io
```

### 1.3 Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** → Edit OAuth Client
3. Add redirect URIs:
   - `https://api.leveragecrm.amzdudes.io/auth/google/callback`
   - `https://api.leveragecrm.amzdudes.io/auth/gmail/callback`

---

## Step 2: Build & Upload Frontend (10 minutes)

### 2.1 Build
```bash
cd frontend
npm install
npm run build
```

### 2.2 Upload
1. Log into Hostinger hPanel
2. **File Manager** → Navigate to `public_html/leveragecrm/`
3. Upload **ALL files** from `frontend/dist/` folder
4. Upload `frontend/.htaccess` file to the same folder

---

## Step 3: Deploy Backend (20-30 minutes)

### If Using VPS:

1. **SSH into VPS:**
   ```bash
   ssh your-username@your-vps-ip
   ```

2. **Create directory:**
   ```bash
   sudo mkdir -p /var/www/leveragecrm-api
   cd /var/www/leveragecrm-api
   ```

3. **Upload backend files** (via SFTP or git):
   - Upload entire `backend/` folder contents

4. **Set up Python:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Create .env file:**
   ```bash
   nano .env
   ```
   Copy from `deployment/hostinger/backend-env.example` and fill in values.

6. **Create systemd service:**
   ```bash
   sudo cp deployment/hostinger/systemd-service.service /etc/systemd/system/leveragecrm-api.service
   sudo systemctl daemon-reload
   sudo systemctl enable leveragecrm-api
   sudo systemctl start leveragecrm-api
   ```

7. **Set up Nginx:**
   ```bash
   sudo cp deployment/hostinger/nginx-config.conf /etc/nginx/sites-available/leveragecrm-api
   sudo ln -s /etc/nginx/sites-available/leveragecrm-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL Certificate:**
   ```bash
   sudo certbot --nginx -d api.leveragecrm.amzdudes.io
   ```

### If Using Shared Hosting with Python:

1. Upload `backend/` folder via File Manager
2. Create Python app in Hostinger panel
3. Point to `backend/` folder
4. Set startup: `uvicorn app:app --host 0.0.0.0 --port 8000`
5. Add environment variables in Hostinger panel

---

## Step 4: Test (5 minutes)

1. **Frontend:** Visit `https://leveragecrm.amzdudes.io`
2. **Backend API:** Visit `https://api.leveragecrm.amzdudes.io/docs`
3. **Test login/signup**
4. **Test Gmail connection**

---

## Troubleshooting

### Backend not starting?
```bash
sudo systemctl status leveragecrm-api
sudo journalctl -u leveragecrm-api -f
```

### Frontend blank page?
- Check browser console
- Verify `.htaccess` is uploaded
- Check that files are in correct folder

### CORS errors?
- Verify `frontend_origins` in `backend/app.py`
- Check `FRONTEND_URL` in backend `.env`

---

## ✅ Done!

Your CRM should now be live at:
- **Frontend:** https://leveragecrm.amzdudes.io
- **Backend API:** https://api.leveragecrm.amzdudes.io

For detailed instructions, see `HOSTINGER_DEPLOYMENT.md`

