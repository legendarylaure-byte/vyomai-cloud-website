# Email Configuration - Architecture & Roadmap

## Current Architecture

VyomAi uses SMTP (Simple Mail Transfer Protocol) for sending emails, which provides:
- ✅ Universal compatibility with any email provider
- ✅ Simple username/password authentication
- ✅ Future-proof for migrations
- ✅ No vendor lock-in

### Current Email Provider: Hostinger
```
Domain: vyomai.cloud
Provider: Hostinger Email Hosting
Primary Account: shekhar@vyomai.cloud
SMTP Host: mail.vyomai.cloud
SMTP Port: 587 (TLS)
```

---

## Email Accounts Setup

### Required Accounts
1. **Primary Account**: shekhar@vyomai.cloud
   - Used for system notifications
   - Sender of automated emails
   - Contact form responses

2. **General Inbox**: info@vyomai.cloud
   - Receives contact form submissions
   - Receives booking requests
   - Public contact email

### Optional Accounts (For Team)
- `support@vyomai.cloud` - Support team inquiries
- `sales@vyomai.cloud` - Sales inquiries
- `noreply@vyomai.cloud` - Transactional emails only

---

## Email Use Cases in VyomAi

### 1. Contact Form Submission
**Flow**:
1. User submits contact form on website
2. Email sent to: `info@vyomai.cloud` (admin notification)
3. Auto-reply sent to: `user_email@example.com` (user confirmation)

**Sender**: `shekhar@vyomai.cloud`

### 2. Booking Request
**Flow**:
1. User submits booking request
2. Email sent to: `info@vyomai.cloud` (admin notification)
3. Auto-reply sent to: `user_email@example.com` (booking confirmation)

**Sender**: `shekhar@vyomai.cloud`

### 3. Admin Notifications (Future)
- Login alerts
- Security notifications
- System alerts
- Data export notifications

---

## Provider Comparison

### Hostinger Email (Current ✅)
| Feature | Status |
|---------|--------|
| Cost | Included with hosting |
| Setup | 5 minutes in cPanel |
| Reliability | 99.9% uptime |
| Deliverability | Good (SPF/DKIM included) |
| Volume Limit | 300 emails/hour |
| Custom Domain | vyomai.cloud ✅ |
| Authentication | SMTP username/password |
| Code Changes | None needed |
| Migration Path | Easy to other SMTP providers |

### Google Cloud Platform (Future 🔮)
| Feature | Status |
|---------|--------|
| Cost | $6-14/user/month |
| Setup | Requires Google Workspace |
| Reliability | 99.9% SLA |
| Deliverability | Excellent (Google reputation) |
| Volume Limit | Unlimited with Workspace |
| Custom Domain | vyomai.cloud ✅ |
| Authentication | OAuth 2.0 |
| Code Changes | Update SMTP credentials only |
| Additional Features | Calendar, Drive, Docs integration |

### SendGrid (Not Recommended)
| Feature | Status |
|---------|--------|
| Cost | $19.95+/month |
| Setup | API key configuration |
| Custom Domain | Requires white-label |
| Limitation | No mailbox access |

---

## Migration Paths

### Path 1: Hostinger → Google Cloud (Recommended)
```
Timeline: When you're ready for Google Workspace
Process:
1. Setup Google Workspace (accounts.google.com/workspace)
2. Add vyomai.cloud domain to Google
3. Create user accounts (shekhar@vyomai.cloud)
4. Update .env with Google SMTP credentials
5. Test email delivery
6. Zero code changes required
```

### Path 2: Hostinger → Microsoft Exchange Online (Not Recommended)
- Not recommended based on your preference
- Would require significant setup
- Higher cost than Hostinger or Google Cloud

---

## What NOT to Use

### ❌ Microsoft Office 365 / Exchange Online
**Why we're NOT using this**:
- Higher cost than alternatives
- More complex setup and maintenance
- Vendor-heavy with many dependencies
- You specifically requested to avoid this

**If forced to migrate to it**:
- SMTP settings would be: smtp.office365.com:587
- Requires App Password or OAuth
- Code changes: Update SMTP credentials only
- Minimal effort but not recommended

---

## Configuration Files

### `.env` (Environment Variables)
```
SMTP_HOST=mail.vyomai.cloud
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=shekhar@vyomai.cloud
SMTP_PASSWORD=***
SMTP_FROM=shekhar@vyomai.cloud
SMTP_FROM_NAME=VyomAi Team
```

### `server/email-service.ts` (Email Logic)
- Handles contact form emails
- Handles booking confirmation emails
- Sends to admin + user confirmation
- Error logging and fallback handling

### Email Recipients (Easily Customizable)
```typescript
// Line 79-80: Contact form destination
to: "info@vyomai.cloud"

// Line 132-135: Booking request destination
to: "info@vyomai.cloud"
```

---

## Testing Email Configuration

### Local Testing
```bash
# Start development server
npm run dev

# Submit contact form
# Check Hostinger webmail or email client for confirmation

# Expected emails:
# 1. Admin notification to: info@vyomai.cloud
# 2. User confirmation to: user_email@example.com
```

### Production Testing
```bash
# After deployment to Hostinger:
# 1. Test contact form with test email
# 2. Verify admin receives notification
# 3. Verify user receives confirmation
# 4. Check both Plain Text and HTML formats
```

---

## Deliverability Best Practices

### DNS Configuration (Hostinger)
**SPF Record** (protects from spoofing):
```
v=spf1 include:hostinger.com ~all
```

**DKIM** (cryptographic signature):
- Auto-configured by Hostinger
- Usually enabled by default

**DMARC** (optional, adds policy):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@vyomai.cloud
```

### Email Content Best Practices
- ✅ Clear, professional subject lines
- ✅ HTML + plain text versions
- ✅ Sender information in footer
- ✅ Contact details included
- ✅ Unsubscribe link (for marketing)
- ✅ Avoid spam trigger words

---

## Monitoring & Logs

### Check Email Status
```bash
# View application logs
tail -f app.log | grep -i email

# Expected success logs:
# [express] POST /api/contact 200
# Email sent successfully

# Expected error logs:
# Error: Failed to send email: SMTP connection refused
```

### Hostinger Email Monitoring
- Check Hostinger cPanel → Email Accounts
- View bounce notifications
- Monitor mailbox size
- Check for quota limits

---

## FAQ

**Q: Can I use multiple email accounts?**
A: Yes! Update `server/email-service.ts` to send from different accounts based on email type.

**Q: What's the email volume limit?**
A: Hostinger: ~300 emails/hour. Sufficient for most use cases. Contact support if higher volume needed.

**Q: How do I change where emails are sent?**
A: Edit `server/email-service.ts`, change the `to` parameter in sendEmail() calls.

**Q: Will switching to Google Cloud require code changes?**
A: No! Only `.env` configuration needs updating. SMTP method stays the same.

**Q: Is email secure?**
A: Yes. TLS encryption on SMTP connection. Use strong password. Keep `.env` secure.

**Q: What if Hostinger email goes down?**
A: Website continues working. Contact forms will fail to send silently. Monitor logs for errors.

**Q: Can I use aliases for vyomai.cloud?**
A: Yes! Ask Hostinger support to add email forwarding/aliases.

---

## Summary

✅ **Current Setup**: Hostinger email hosting with vyomai.cloud domain  
✅ **Future Ready**: Can migrate to Google Cloud Platform anytime  
✅ **No Microsoft**: Avoiding Office 365 per your preference  
✅ **Flexible**: SMTP method works with any provider  
✅ **Team Ready**: Multiple email accounts supported  

**Next Steps**:
1. Create email accounts in Hostinger
2. Update `.env` with SMTP credentials
3. Test email delivery
4. Setup DNS records (SPF, DKIM) for deliverability

---

**Last Updated**: November 29, 2025
