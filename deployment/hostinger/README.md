# Hostinger Deployment Files

This folder contains all configuration files needed to deploy the CRM to Hostinger.

## Files in this folder:

1. **nginx-config.conf** - Nginx reverse proxy configuration for the backend API
2. **systemd-service.service** - Systemd service file to run the backend as a service
3. **backend-env.example** - Template for backend `.env` file
4. **DEPLOY_QUICK_START.md** - Quick step-by-step deployment guide

## Additional files needed:

- **frontend/.htaccess** - Apache rewrite rules for React Router (already created)
- **frontend/.env.production** - Frontend environment variables (create this manually)

## Frontend .env.production

Create `frontend/.env.production` with:
```env
VITE_API_BASE_URL=https://api.leveragecrm.amzdudes.io
```

## Usage

1. Follow `DEPLOY_QUICK_START.md` for step-by-step instructions
2. Or see `HOSTINGER_DEPLOYMENT.md` in the root directory for detailed guide

