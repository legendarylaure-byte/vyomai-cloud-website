# VyomAi Deployment Guide

## Quick Start - Local Development

```bash
# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment - Hostinger

### 1. Prepare Environment

```bash
# Generate secure passwords and secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env with production values
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_very_secure_password
SESSION_SECRET=generated_random_string
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://user:password@host/vyomai
```

### 2. Setup Database (PostgreSQL)

```bash
# Option A: Use Neon (Recommended)
# 1. Create account at https://neon.tech
# 2. Create database project
# 3. Copy connection string to DATABASE_URL

# Option B: Self-hosted PostgreSQL
# 1. Install PostgreSQL on Hostinger
# 2. Create database and user
# 3. Run migrations: npm run db:push
```

### 3. Deploy with Docker

```bash
# Build Docker image
docker build -t vyomai-app .

# Run with docker-compose
docker-compose up -d

# Or with HTTPS (nginx + Let's Encrypt)
docker-compose -f docker-compose-https.yml up -d
```

### 4. Setup HTTPS/SSL

For `docker-compose-https.yml`:

```bash
# 1. Create nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://vyomai-app:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. Place SSL certificates in ./certs/ directory
# Use Let's Encrypt or your certificate provider
# - cert.pem (public certificate)
# - key.pem (private key)

# 3. Start with HTTPS
docker-compose -f docker-compose-https.yml up -d
```

### 5. Configure Integrations

#### Email Configuration - Hostinger vyomai.cloud Domain
```bash
# Using Hostinger Email Hosting (Recommended)
# 1. Create email accounts in Hostinger cPanel:
#    - shekhar@vyomai.cloud (main account)
#    - info@vyomai.cloud (for contact forms)
#    - support@vyomai.cloud (optional, for support)
#
# 2. Get SMTP details from Hostinger:
#    - SMTP Host: mail.vyomai.cloud (or smtp.hostinger.com)
#    - SMTP Port: 587 (TLS)
#    - SMTP User: shekhar@vyomai.cloud
#    - SMTP Password: [your email account password]
#
# 3. Add to .env:
SMTP_HOST=mail.vyomai.cloud
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=shekhar@vyomai.cloud
SMTP_PASSWORD=your_hostinger_email_password
SMTP_FROM=shekhar@vyomai.cloud
SMTP_FROM_NAME=VyomAi Team

# For detailed setup: See HOSTINGER_EMAIL_SETUP.md

# Future Google Cloud Platform Integration:
# When ready, migrate email to Google Workspace:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=shekhar@vyomai.cloud
# SMTP_PASSWORD=[Google App Password]
```

#### Fonepay Payment Gateway
```bash
# 1. Register with Fonepay: https://www.fonepay.com
# 2. Get merchant credentials
# 3. Add to .env:
FONEPAY_MERCHANT_CODE=your_merchant_code
FONEPAY_SECRET_KEY=your_secret_key
```

#### PostgreSQL Database
```bash
# 1. Create PostgreSQL database
# 2. Add connection string to .env:
DATABASE_URL=postgresql://username:password@host:5432/vyomai

# 3. Run migrations:
npm run db:push
```

## Features Configuration

### 2FA Security (TOTP)
```bash
# Enabled via admin interface:
# 1. Login to admin dashboard
# 2. Go to Settings → Security
# 3. Setup 2FA with authenticator app
# 4. Scan QR code
# 5. Verify with TOTP token
```

### Admin Access
```bash
# Default credentials (CHANGE IN PRODUCTION):
Username: admin
Password: admin123

# For production:
# Change ADMIN_USERNAME and ADMIN_PASSWORD in .env
```

## Monitoring & Maintenance

### Health Check
```bash
curl -s http://localhost:5000/api/visitors
# Should return visitor stats JSON
```

### Logs
```bash
# View Docker logs
docker-compose logs -f vyomai-app

# For HTTPS setup
docker-compose -f docker-compose-https.yml logs -f
```

### Database Backup
```bash
# Backup PostgreSQL
pg_dump postgresql://user:pass@host/vyomai > backup.sql

# Restore from backup
psql postgresql://user:pass@host/vyomai < backup.sql
```

## Security Checklist

- [ ] Change default admin credentials
- [ ] Set strong SESSION_SECRET
- [ ] Configure HTTPS/SSL certificates
- [ ] Setup SendGrid API key for email notifications
- [ ] Enable 2FA in admin settings
- [ ] Configure database backups
- [ ] Set up firewall rules (allow 80, 443 only)
- [ ] Enable rate limiting on login endpoint (already configured)
- [ ] Review environment variables - no secrets in code
- [ ] Test email notifications
- [ ] Test 2FA authentication
- [ ] Monitor application logs

## Troubleshooting

### Port Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check migrations
npm run db:push
```

### Email Not Sending
```bash
# Verify SendGrid API key
curl https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

### SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in certs/cert.pem -text -noout

# Renew Let's Encrypt certificate
docker-compose exec nginx certbot renew
```

## Support
For issues, contact: info@vyomai.cloud

Last Updated: November 29, 2025
