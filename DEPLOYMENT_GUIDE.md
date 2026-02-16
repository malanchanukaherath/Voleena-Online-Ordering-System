# Voleena Foods - Production Deployment Guide

## Prerequisites

### System Requirements
- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **MySQL:** >= 8.0
- **Redis:** >= 6.0 (optional, for distributed rate limiting)
- **SSL Certificate:** For HTTPS

### External Services
- Google Maps API key
- PayHere merchant account (Sri Lankan payment gateway)
- Stripe account (international payments)
- SMTP server (Gmail, SendGrid, etc.)
- Twilio account (SMS notifications)

---

## Step 1: Database Setup

### 1.1 Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE voleena_foods_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'voleena_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON voleena_foods_db.* TO 'voleena_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.2 Run Production Schema
```bash
mysql -u voleena_user -p voleena_foods_db < database/production_schema.sql
```

### 1.3 Verify Tables
```bash
mysql -u voleena_user -p voleena_foods_db -e "SHOW TABLES;"
```

Expected output: 16 tables

---

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd server
npm install
```

### 2.2 Configure Environment
```bash
cp .env.production .env
```

Edit `.env` and set all required variables:

```bash
# Critical variables to change:
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-32-char-random-string>
DB_PASSWORD=<your-database-password>
GOOGLE_MAPS_API_KEY=<your-google-maps-key>
SMTP_USER=<your-smtp-email>
SMTP_PASS=<your-smtp-password>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
PAYHERE_MERCHANT_ID=<your-payhere-id>
PAYHERE_MERCHANT_SECRET=<your-payhere-secret>
STRIPE_SECRET_KEY=<your-stripe-secret>
FRONTEND_URL=https://yourdomain.com
```

### 2.3 Generate Secure Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Test Server
```bash
npm run dev
```

Visit: `http://localhost:3001/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T...",
  "uptime": 1.234,
  "environment": "development"
}
```

---

## Step 3: Create Admin User

### 3.1 Hash Password
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@123', 12, (err, hash) => console.log(hash));"
```

### 3.2 Insert Admin
```sql
INSERT INTO staff (name, role_id, email, phone, password, is_active)
VALUES (
  'System Admin',
  (SELECT role_id FROM role WHERE role_name = 'Admin'),
  'admin@voleenafoods.lk',
  '0771234567',
  '<hashed-password-from-step-3.1>',
  1
);
```

### 3.3 Test Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@voleenafoods.lk",
    "password": "Admin@123",
    "userType": "staff"
  }'
```

---

## Step 4: Production Deployment

### 4.1 Install PM2
```bash
npm install -g pm2
```

### 4.2 Create PM2 Ecosystem File
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'voleena-api',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### 4.3 Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4.4 Monitor
```bash
pm2 status
pm2 logs voleena-api
pm2 monit
```

---

## Step 5: Nginx Configuration

### 5.1 Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 5.2 Configure Reverse Proxy
Create `/etc/nginx/sites-available/voleena-api`:

```nginx
server {
    listen 80;
    server_name api.voleenafoods.lk;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.voleenafoods.lk;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.voleenafoods.lk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.voleenafoods.lk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    # File Upload Limit
    client_max_body_size 10M;
}
```

### 5.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/voleena-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.voleenafoods.lk
sudo certbot renew --dry-run
```

---

## Step 7: Database Backup

### 7.1 Create Backup Script
Create `/home/user/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
DB_NAME="voleena_foods_db"
DB_USER="voleena_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/voleena_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "voleena_*.sql.gz" -mtime +30 -delete
```

### 7.2 Schedule Backup
```bash
chmod +x /home/user/backup-db.sh
crontab -e
```

Add:
```
0 2 * * * /home/user/backup-db.sh
```

---

## Step 8: Monitoring & Logging

### 8.1 Application Logs
```bash
# PM2 logs
pm2 logs voleena-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 8.2 Database Monitoring
```sql
-- Check connections
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'voleena_foods_db'
ORDER BY size_mb DESC;
```

---

## Step 9: Security Hardening

### 9.1 Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 9.2 Fail2Ban
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 9.3 MySQL Security
```bash
mysql_secure_installation
```

---

## Step 10: Testing

### 10.1 Health Check
```bash
curl https://api.voleenafoods.lk/health
```

### 10.2 API Test
```bash
# Login
curl -X POST https://api.voleenafoods.lk/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@voleenafoods.lk",
    "password": "Admin@123",
    "userType": "staff"
  }'

# Get menu items
curl https://api.voleenafoods.lk/api/v1/menu/items
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connection
mysql -u voleena_user -p voleena_foods_db -e "SELECT 1;"
```

### Server Not Starting
```bash
# Check logs
pm2 logs voleena-api --err

# Check environment
pm2 env 0

# Restart
pm2 restart voleena-api
```

### High Memory Usage
```bash
# Check PM2 processes
pm2 monit

# Reduce instances
pm2 scale voleena-api 2
```

---

## Maintenance

### Update Application
```bash
cd /path/to/voleena-backend
git pull
npm install
pm2 restart voleena-api
```

### Database Migration
```bash
# Backup first
./backup-db.sh

# Run migration
mysql -u voleena_user -p voleena_foods_db < migration.sql

# Restart app
pm2 restart voleena-api
```

### Clean Token Blacklist
Automated job runs every 6 hours, or manually:
```sql
DELETE FROM token_blacklist WHERE expires_at < NOW();
```

---

## Performance Optimization

### Enable Redis for Rate Limiting
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Update `.env`:
```
REDIS_URL=redis://localhost:6379
```

### Database Optimization
```sql
-- Analyze tables
ANALYZE TABLE order, order_item, daily_stock;

-- Optimize tables
OPTIMIZE TABLE order, order_item, daily_stock;
```

---

## Support

For issues or questions:
- **Documentation:** See API_DOCUMENTATION.md
- **Logs:** Check PM2 and Nginx logs
- **Database:** Check MySQL error log
- **Email:** support@voleenafoods.lk

---

**Deployment Checklist:**
- [ ] Database created and schema loaded
- [ ] Environment variables configured
- [ ] Admin user created
- [ ] PM2 configured and running
- [ ] Nginx configured with SSL
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] API tested
- [ ] Frontend deployed and connected

**Last Updated:** 2026-02-16
