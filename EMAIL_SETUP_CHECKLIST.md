# Email Setup Checklist - Pre-Deployment

## Email Configuration Summary
✅ **Provider**: Hostinger Email Hosting  
✅ **Domain**: vyomai.cloud  
✅ **Primary Account**: shekhar@vyomai.cloud  
✅ **Admin Inbox**: info@vyomai.cloud  
✅ **Microsoft Office 365**: NOT USED (per user preference)  
✅ **Gmail**: Not used directly (future-ready for Google Cloud Platform)

---

## Pre-Deployment Email Setup (Do This Before Going Live)

### Step 1: Create Email Accounts in Hostinger (Required)
```
[ ] Login to Hostinger cPanel
[ ] Navigate to Email Accounts
[ ] Create: shekhar@vyomai.cloud
    - Set strong password (12+ chars, mix of types)
[ ] Create: info@vyomai.cloud  
    - Set strong password
[ ] (Optional) Create: support@vyomai.cloud
[ ] (Optional) Create: sales@vyomai.cloud
```

### Step 2: Get SMTP Credentials (Required)
```
[ ] In Hostinger cPanel, find SMTP settings
[ ] Verify SMTP Host: mail.vyomai.cloud (or smtp.hostinger.com)
[ ] Verify SMTP Port: 587 (TLS)
[ ] Note SMTP User: shekhar@vyomai.cloud (full email address)
[ ] Note SMTP Password: [email account password you set above]
```

### Step 3: Configure Environment Variables (Required)
Update `.env` on your server:
```bash
SMTP_HOST=mail.vyomai.cloud
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=shekhar@vyomai.cloud
SMTP_PASSWORD=your_hostinger_email_password
SMTP_FROM=shekhar@vyomai.cloud
SMTP_FROM_NAME=VyomAi Team
```

### Step 4: Setup DNS Records (Recommended for Deliverability)
```
[ ] Login to Hostinger Domain Management
[ ] Add SPF Record:
    Name: @
    Type: TXT
    Value: v=spf1 include:hostinger.com ~all
    
[ ] Check DKIM Record (usually auto-configured by Hostinger)
    - Should already exist in DNS
    - If not, ask Hostinger support
    
[ ] (Optional) Add DMARC Record:
    Name: _dmarc
    Type: TXT
    Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@vyomai.cloud
```

### Step 5: Test Email Delivery (Required Before Going Live)
```bash
# Start your application
npm run dev

# Submit a test contact form on your website
# Fill with:
  - Name: Test User
  - Email: your_personal_email@example.com
  - Subject: Test Email
  - Message: This is a test

# Check three things:
[ ] 1. Admin notification arrives at info@vyomai.cloud
[ ] 2. User confirmation arrives at your_personal_email@example.com
[ ] 3. Both emails are properly formatted (HTML readable)
```

### Step 6: Verify Email Configuration in Code (Already Done)
```
[✓] server/email-service.ts configured with Hostinger SMTP
[✓] .env.example updated with correct SMTP settings
[✓] Contact form sends to info@vyomai.cloud
[✓] Booking form sends to info@vyomai.cloud
[✓] No Microsoft Office 365 references
[✓] No hardcoded Gmail references
```

---

## Common SMTP Issues & Solutions

### Issue: "SMTP Connection Refused"
**Checklist**:
```
[ ] SMTP_HOST is exactly: mail.vyomai.cloud
[ ] SMTP_PORT is exactly: 587
[ ] SMTP_SECURE is set to: true
[ ] Server can reach external internet (firewall allows port 587)
[ ] Contact Hostinger support if problem persists
```

### Issue: "Authentication Failed"  
**Checklist**:
```
[ ] SMTP_USER is full email: shekhar@vyomai.cloud (not just "shekhar")
[ ] SMTP_PASSWORD is correct email account password (not cPanel password)
[ ] No spaces or typos in credentials
[ ] Special characters in password are properly escaped in .env
[ ] Reset email password in Hostinger if unsure
```

### Issue: "Email Sent But Not Received"
**Checklist**:
```
[ ] Check Hostinger email inbox for bounce notifications
[ ] Verify DNS SPF/DKIM records are properly set
[ ] Check recipient email spam folder
[ ] Test with different recipient email first
[ ] Check application logs for error messages
```

---

## Email Configuration Files Reference

### Files to Update Before Deployment
1. **`.env`** - Copy from `.env.example` and fill in:
   ```
   SMTP_HOST=mail.vyomai.cloud
   SMTP_PORT=587
   SMTP_SECURE=true
   SMTP_USER=shekhar@vyomai.cloud
   SMTP_PASSWORD=[your password]
   SMTP_FROM=shekhar@vyomai.cloud
   SMTP_FROM_NAME=VyomAi Team
   ```

2. **`server/email-service.ts`** - Already configured ✓
   - Lines 79-80: Contact form sends to info@vyomai.cloud
   - Lines 132-135: Booking sends to info@vyomai.cloud
   - Can be customized for different recipient emails

3. **`DEPLOYMENT_GUIDE.md`** - Already updated ✓
   - Email setup instructions included
   - Hostinger SMTP configuration documented

4. **`HOSTINGER_EMAIL_SETUP.md`** - New comprehensive guide ✓
   - Step-by-step Hostinger setup
   - Troubleshooting guide included
   - Future Google Cloud Platform migration path

---

## Security Checklist

```
[ ] Email passwords are NOT stored in code (only in .env)
[ ] .env file is in .gitignore (not committed to repo)
[ ] .env file permissions are restricted (600 or 640)
[ ] SMTP_SECURE is set to true (TLS encryption)
[ ] Email account password is strong (12+ chars, mixed case, symbols)
[ ] Email account password is different from Hostinger cPanel password
[ ] No test emails left in production code
[ ] Email logs don't contain passwords
```

---

## Migration to Google Cloud Platform (Future)

### When Ready to Use Google Workspace
```bash
# These changes only needed if/when you migrate to Google Cloud:

# 1. Setup Google Workspace
#    - Go to workspace.google.com
#    - Add vyomai.cloud domain
#    - Create user: shekhar@vyomai.cloud

# 2. Generate Google App Password
#    - Go to myaccount.google.com/apppasswords
#    - Create app password for "Mail"
#    - Copy the generated password

# 3. Update .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=shekhar@vyomai.cloud
SMTP_PASSWORD=[Google App Password]
SMTP_FROM=shekhar@vyomai.cloud
SMTP_FROM_NAME=VyomAi Team

# 4. Restart application
npm run dev

# No code changes needed! SMTP configuration stays the same.
```

---

## Summary

**Current Email Architecture**:
- ✅ Using Hostinger Email Hosting
- ✅ Custom domain: vyomai.cloud
- ✅ SMTP protocol for universal compatibility
- ✅ Future-ready for Google Cloud Platform migration
- ✅ NOT using Microsoft Office 365 (per user preference)

**Email Accounts Needed**:
1. shekhar@vyomai.cloud (primary sender)
2. info@vyomai.cloud (receives forms/bookings)

**To Deploy**:
1. Create email accounts in Hostinger
2. Update `.env` with SMTP credentials
3. Add SPF/DKIM DNS records
4. Test with contact form
5. Go live!

**Support Documentation**:
- `HOSTINGER_EMAIL_SETUP.md` - Complete setup guide
- `EMAIL_CONFIGURATION.md` - Architecture & roadmap
- `DEPLOYMENT_GUIDE.md` - Updated with email section

---

**Status**: Ready for production deployment ✅  
**Last Updated**: November 29, 2025  
**Next Steps**: See "Pre-Deployment Email Setup" section above
