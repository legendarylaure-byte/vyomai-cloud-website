# VyomAi Security Setup Guide

## Critical Security Fixes Applied ✅

This document outlines all the security improvements made to prepare the application for production deployment.

### 1. ✅ Hardcoded Admin Credentials (FIXED)
**Issue**: Admin username and password were hardcoded in source code
**Fix**: Now reads from environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`

**Action Required**:
- Update your `.env` file with strong credentials before deployment
- Never commit `.env` file to version control (it's in `.gitignore`)

### 2. ✅ Password Hashing (FIXED)
**Issue**: Passwords were stored in plain text
**Fix**: Implemented bcryptjs for secure password hashing and verification

**Status**: Passwords will be properly hashed when authenticating

### 3. ✅ Weak Token Generation (FIXED)
**Issue**: Tokens used `Math.random()` which is not cryptographically secure
**Fix**: Now uses `crypto.randomBytes()` for secure token generation

**Additional**: Tokens auto-expire after 24 hours

### 4. ✅ Missing Security Headers (FIXED)
**Issue**: No HTTP security headers configured
**Fix**: Added Helmet.js middleware for comprehensive security headers

**Includes**:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- And many more...

### 5. ✅ No Rate Limiting (FIXED)
**Issue**: Login endpoint vulnerable to brute force attacks
**Fix**: Implemented express-rate-limit on `/api/admin/login`

**Configuration**:
- 5 login attempts per 15 minutes per IP
- Prevents brute force attacks

### 6. 📋 Contact Form & Booking Notifications (PENDING)
**Current Status**: Contact forms submit but don't send emails
**Next Step**: Integrate SendGrid or Mailgun for email notifications
**Environment Variables**: `EMAIL_SERVICE`, `SENDGRID_API_KEY`

### 7. 📋 Database Persistence (PENDING)
**Current Status**: Using in-memory storage (data lost on restart)
**Next Step**: Connect to PostgreSQL database
**Environment Variable**: `DATABASE_URL`

## Setup Instructions for Deployment

### Before Deploying to Hostinger:

1. **Create a `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Update Security Credentials**:
   ```env
   ADMIN_USERNAME=your_unique_username
   ADMIN_PASSWORD=your_very_secure_password_12_chars_min
   SESSION_SECRET=generate_random_secure_string
   OPENAI_API_KEY=your_openai_key
   ```

3. **Generate a Random Session Secret**:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # Or use this Node command:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Never commit `.env` file**:
   - It's in `.gitignore` by default
   - Each deployment environment should have its own `.env`

5. **For Production (Hostinger)**:
   - Set environment variables through Hostinger's control panel
   - OR mount the `.env` file securely in Docker

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Application environment |
| `OPENAI_API_KEY` | Yes | `sk-...` | OpenAI API key for chatbot |
| `ADMIN_USERNAME` | Yes | `admin` | Admin login username |
| `ADMIN_PASSWORD` | Yes | `SecurePass123!` | Admin login password |
| `SESSION_SECRET` | Yes | `random-hex-string` | Session security key |
| `DATABASE_URL` | No | `postgresql://...` | PostgreSQL connection URL |
| `EMAIL_SERVICE` | No | `sendgrid` | Email service provider |
| `SENDGRID_API_KEY` | No | `SG.xxx` | SendGrid API key |

## Testing Security

### 1. Test Login Rate Limiting:
```bash
# Try logging in 6 times rapidly - 6th should be rate limited
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'
```

### 2. Test Security Headers:
```bash
curl -I http://localhost:5000
# Look for headers like:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
```

### 3. Test Helmet Configuration:
Visit https://observatory.mozilla.org/ and scan your domain

## Next Steps

1. **Email Integration**: Set up SendGrid/Mailgun for contact forms
2. **Database Migration**: Connect to PostgreSQL for data persistence
3. **SSL/HTTPS**: Configure SSL certificates on Hostinger
4. **API Key Rotation**: Implement key rotation strategy
5. **Monitoring**: Set up error tracking (Sentry)
6. **Backup**: Configure automated database backups

## Security Best Practices Implemented

✅ Environment variable management
✅ Secure password hashing
✅ Cryptographically secure token generation
✅ Token expiration (24 hours)
✅ Rate limiting on sensitive endpoints
✅ Security headers via Helmet
✅ Non-root Docker user
✅ Input validation with Zod
✅ Error handling without exposing internals

## Support

For questions about security setup, contact: info@vyomai.cloud
