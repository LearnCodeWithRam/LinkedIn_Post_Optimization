# Nginx Configuration for Frontend + Backend

This guide explains how to set up nginx to serve both your React frontend and Django backend through a single domain.

## Architecture

- Frontend (React): Running on `localhost:3000`
- Backend (Django): Running on `localhost:8000`
- Nginx: Proxies requests to appropriate service
  - `/` → Frontend (React)
  - `/api/` → Backend (Django)
  - `/admin/` → Backend (Django Admin)

## Setup Steps

### 1. Install Nginx (if not already installed)

```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Copy Nginx Configuration

```bash
# Copy the nginx.conf to sites-available
sudo cp nginx.conf /etc/nginx/sites-available/feedisight

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/feedisight /etc/nginx/sites-enabled/

# Remove default configuration (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Test Nginx Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Reload Nginx

```bash
sudo systemctl reload nginx
```

Or restart if needed:
```bash
sudo systemctl restart nginx
```

### 5. Start Your Services

Make sure both services are running:

```bash
# Start Django backend (in backend directory)
cd backend
python manage.py runserver 0.0.0.0:8000

# Start React frontend (in frontend directory)
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

### 6. Update Frontend Environment

The frontend `.env` file has been updated to use `/api` as the base URL:

```env
VITE_API_URL=/api
```

This means all API calls will be relative to your domain:
- `www.feedisight.fixzi.in/api/v1/accounts/send-otp/`
- `www.feedisight.fixzi.in/api/v1/new_post/chat/`

### 7. Update Backend CORS Settings

Make sure your Django backend allows requests from your domain. In `backend/config/settings/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    'http://www.feedisight.fixzi.in',
    'https://www.feedisight.fixzi.in',
    'http://localhost:3000',  # Keep for local development
]

ALLOWED_HOSTS = [
    'www.feedisight.fixzi.in',
    'localhost',
    '127.0.0.1',
]
```

## Testing

1. Visit `http://www.feedisight.fixzi.in` - Should show your React frontend
2. Check browser console for any API errors
3. Test login/authentication flows
4. Verify API calls are going to `/api/v1/...` endpoints

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### View Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### View Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

### Check if Services are Running
```bash
# Check if Django is running on port 8000
sudo netstat -tlnp | grep 8000

# Check if React is running on port 3000
sudo netstat -tlnp | grep 3000
```

### Common Issues

1. **502 Bad Gateway**: Backend service is not running
   - Solution: Start Django on port 8000

2. **Connection Refused**: Frontend service is not running
   - Solution: Start React on port 3000

3. **CORS Errors**: Backend not allowing requests from your domain
   - Solution: Update CORS_ALLOWED_ORIGINS in Django settings

4. **404 on API calls**: Nginx not routing correctly
   - Solution: Check nginx configuration and reload

## Production Considerations

For production deployment, consider:

1. **Use Production Builds**:
   ```bash
   # Build React for production
   cd frontend
   npm run build
   
   # Serve static files with nginx instead of dev server
   ```

2. **Use Gunicorn for Django**:
   ```bash
   gunicorn config.wsgi:application --bind 127.0.0.1:8000
   ```

3. **Enable SSL/HTTPS**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d www.feedisight.fixzi.in
   ```

4. **Use Process Managers**:
   - systemd for Django/Gunicorn
   - PM2 for Node.js processes (if needed)

5. **Static File Serving**:
   - Configure nginx to serve React build files directly
   - Configure Django to serve static/media files through nginx
