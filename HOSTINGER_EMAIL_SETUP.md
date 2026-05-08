# VyomAi Email Configuration - Hostinger Setup Guide

## Overview
This guide explains how to configure VyomAi to use email hosting from Hostinger's vyomai.cloud domain.

**Architecture**: VyomAi uses SMTP (Simple Mail Transfer Protocol) to send emails, which works with any email provider including:
- ✅ Hostinger Email Hosting (Current)
- ✅ Google Cloud Platform (Future ready)
- ✅ Microsoft Exchange Online (Not recommended for your case)
- ✅ Any SMTP-compatible email service

---

## Step 1: Setup Email Hosting on Hostinger

### Create Email Account
1. Login to Hostinger cPanel
2. Go to **Email Accounts**
3. Click **Create Email Account**
4. Configure:
   - **Email Address**: `shekhar@vyomai.cloud`
   - **Password**: Choose a strong password (different from hosting password)
   - **Quota**: 1000 MB (adjust as needed)
5. Click **Create**

### Create Additional Email Accounts (For Team Members)
Repeat the process for other team members:
- `support@vyomai.cloud`
- `sales@vyomai.cloud`
- `info@vyomai.cloud` (for general inquiries)
- `noreply@vyomai.cloud` (for automated notifications)

---

## Step 2: Get SMTP Configuration from Hostinger

### Hostinger SMTP Settings
```
SMTP Host: mail.vyomai.cloud
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP Secure: Yes (TLS/SSL required)
SMTP User: shekhar@vyomai.cloud
SMTP Password: [Your email account password]
```

**Alternative Hostinger SMTP Host**:
- If `mail.vyomai.cloud` doesn't work, try: `smtp.hostinger.com`
- For Hostinger Business: `mail.hostinger.com`

### Verify Email Configuration
1. In Hostinger cPanel, go to **Email Accounts**
2. Look for SMTP settings in the account details
3. Note the exact hostname and port

---

## Step 3: Update VyomAi Configuration

### Edit `.env` File
```bash
# Email Configuration for Hostinger
SENDGRID_API_KEY=
SMTP_HOST=mail.vyomai.cloud
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=shekhar@vyomai.cloud
SMTP_PASSWORD=your_hostinger_email_password
SMTP_FROM=shekhar@vyomai.cloud
SMTP_FROM_NAME=VyomAi Team
```

### Important Notes:
- **SMTP_USER**: Must match exactly with your Hostinger email account
- **SMTP_PASSWORD**: Use the password you set when creating the email account, NOT your cPanel password
- **SMTP_SECURE**: Always set to `true` for security
- **SMTP_FROM**: Should match SMTP_USER or be an alias on that account
- **SENDGRID_API_KEY**: Leave empty (not using SendGrid)

---

## Step 4: Email Addresses Used by VyomAi

### System Emails Sent To:
- **Contact Form**: Sends to `info@vyomai.cloud` (main inbox)
- **Booking Request**: Sends to `info@vyomai.cloud` (main inbox)
- **User Confirmations**: Sent from `shekhar@vyomai.cloud` (or whichever account you configure)

### Change Email Recipients
To change where emails are sent, edit `server/email-service.ts`:

**Line 79-80**: Contact form emails
```typescript
await sendEmail({
  to: "support@vyomai.cloud",  // Change this to your preferred email
```

**Line 132-135**: Booking request emails
```typescript
await sendEmail({
  to: "sales@vyomai.cloud",  // Change this to your preferred email
```

---

## Step 5: Test Email Configuration

### Test Contact Form Email
1. Go to your website's contact form
2. Submit a test message
3. Check your Hostinger email inbox for the notification

### Test Booking Confirmation
1. Submit a booking request
2. Check both your email and the user's email for confirmations

### Debug Email Issues
If emails aren't being sent:

1. **Check logs**:
   ```bash
   tail -f logs/app.log | grep -i email
   ```

2. **Verify SMTP credentials**:
   - Username must include full email address: `shekhar@vyomai.cloud`
   - Password must be the email account password (not cPanel password)
   - Port 587 (TLS) is generally more reliable than 465 (SSL)

3. **Check firewall rules**:
   - Port 587 must be open on your server
   - Some hosts block SMTP - contact Hostinger support if needed

4. **Verify DNS records**:
   - SPF record: `v=spf1 include:hostinger.com ~all`
   - DKIM: Should be auto-configured by Hostinger
   - DMARC: Optional but recommended

---

## Step 6: Future Google Cloud Platform Integration

### When Ready to Use Google Cloud Platform Email

Google Cloud Platform (Gmail API) uses OAuth instead of SMTP password. To migrate in the future:

**Option A: Keep Hostinger Email, Add Google Cloud for Other Apps**
- Hostinger email: vyomai.cloud accounts (contact forms, notifications)
- Google Cloud: For other applications (docs, storage, etc.)
- No changes needed to VyomAi email config

**Option B: Migrate Email to Google Cloud (Future)**

If you later want to use Google Cloud Platform for email:

1. **Setup Google Workspace**:
   - Add vyomai.cloud domain to Google Workspace
   - Create user accounts: shekhar@vyomai.cloud in Google

2. **Update VyomAi Config**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=true
   SMTP_USER=shekhar@vyomai.cloud
   SMTP_PASSWORD=[Google App Password]
   ```

3. **Generate Google App Password**:
   - Go to myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Use the generated password in SMTP_PASSWORD

---

## Email Deliverability Best Practices

### 1. DNS Configuration
Add these records to your vyomai.cloud domain on Hostinger:

**SPF Record** (TXT):
```
v=spf1 include:hostinger.com ~all
```

**DKIM** (Auto-configured by Hostinger)
- Usually found in Hostinger Email settings
- Copy DKIM public key and add to DNS

**DMARC Record** (TXT, Optional):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@vyomai.cloud
```

### 2. Sender Reputation
- ✅ Use consistent sender email (shekhar@vyomai.cloud)
- ✅ Add DKIM and SPF records
- ✅ Monitor bounce rates
- ✅ Keep unsubscribe options (for marketing emails)
- ✅ Avoid spam trigger words in email content

### 3. Email Templates
All VyomAi emails have:
- ✅ Clear subject lines
- ✅ Professional HTML formatting
- ✅ Contact information in footer
- ✅ Plain text fallback

---

## Troubleshooting

### Issue: "SMTP Connection Refused"
**Solution**:
1. Verify SMTP_HOST is correct: `mail.vyomai.cloud`
2. Verify SMTP_PORT: 587 (TLS recommended)
3. Check firewall allows port 587
4. Contact Hostinger support if problem persists

### Issue: "Authentication Failed"
**Solution**:
1. Double-check SMTP_USER: Must be full email `shekhar@vyomai.cloud`
2. Verify SMTP_PASSWORD: Use email account password, not cPanel password
3. Reset email password in Hostinger cPanel if unsure
4. Verify no special characters in password need escaping

### Issue: "Email Sent But Not Received"
**Solution**:
1. Check Hostinger email logs for bounce reasons
2. Verify DNS records (SPF, DKIM) are properly configured
3. Check recipient's spam folder
4. Verify email address doesn't have typo
5. Test with different recipient email first

### Issue: "Cannot Connect to SMTP Host"
**Solution**:
1. Verify server has internet access
2. Check firewall rules on Hostinger
3. Try alternative Hostinger SMTP: `smtp.hostinger.com`
4. Contact Hostinger support for SMTP endpoint verification

---

## Email Logs and Monitoring

### View Email Logs
```bash
# Check application logs
tail -f logs/app.log | grep -i "email\|mail\|smtp"

# Check email delivery status
# In Hostinger cPanel -> Email Accounts -> View email account details
```

### Email Service Status
VyomAi logs all email attempts:
- ✅ Successful sends
- ❌ Failed sends (with error reason)
- ℹ️ Fallback warnings

---

## Security Considerations

### ✅ Recommended Security Practices
1. **Strong Email Password**:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Different from hosting password

2. **Email Account Backup**:
   - Regularly backup important emails from info@vyomai.cloud
   - Hostinger provides automatic backups

3. **Two-Factor Authentication**:
   - Enable 2FA on Hostinger account
   - Protects email credentials

4. **Environment Variable Security**:
   - Keep `.env` file secure
   - Don't commit to version control
   - Rotate SMTP_PASSWORD periodically

---

## Summary

**Current Setup**:
- Email Provider: Hostinger
- Domain: vyomai.cloud
- Primary Account: shekhar@vyomai.cloud
- SMTP Host: mail.vyomai.cloud:587 (TLS)

**Future Flexibility**:
- Easy to migrate to Google Cloud Platform
- SMTP method works with any provider
- No code changes needed for provider switches

**Next Steps**:
1. Create email accounts in Hostinger
2. Update `.env` with SMTP credentials
3. Test contact form submission
4. Verify email delivery
5. Setup DNS records (SPF, DKIM) if needed

---

## Support

For Hostinger-specific issues:
- Hostinger Support: https://support.hostinger.com
- Check Hostinger Email Troubleshooting: https://support.hostinger.com/en/articles/360000062269

For VyomAi email configuration issues:
- Check `server/email-service.ts` implementation
- Review application logs for SMTP errors
- Verify `.env` configuration matches Hostinger settings

---

**Last Updated**: November 29, 2025
