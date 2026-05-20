import { escapeHtml } from "./email-providers.js";

interface TemplateOptions {
  recipientName?: string;
  type?: string;
  adminUrl?: string;
}

function buildEmailWrapper(contentHtml: string, options?: TemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>VyomAi</title>
<style type="text/css">
body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
body{margin:0;padding:0;width:100%!important;height:100%!important;font-family:'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;background-color:#f4f4f5;-webkit-font-smoothing:antialiased}
.email-container{max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden}
.email-header{background:linear-gradient(135deg,#8B5CF6 0%,#A855F7 40%,#F97316 100%);padding:40px 30px;text-align:center}
.email-header h1{color:#ffffff;font-size:28px;font-weight:700;margin:0;letter-spacing:2px}
.email-header .tagline{color:rgba(255,255,255,0.85);font-size:14px;margin-top:6px;font-weight:300}
.email-header .stars{font-size:18px;letter-spacing:5px;color:rgba(255,255,255,0.5);margin-bottom:4px}
.divider{height:4px;background:linear-gradient(90deg,#8B5CF6,#F97316)}
.email-body{padding:36px 32px;color:#334155;font-size:15px}
.email-body h2{color:#1e293b;font-size:20px;font-weight:700;margin:0 0 16px 0}
.email-body h3{color:#1e293b;font-size:16px;font-weight:600;margin:20px 0 8px 0}
.email-body p{margin:0 0 12px 0}
.details-card{background:#f8fafc;border-left:4px solid #8B5CF6;border-radius:8px;padding:20px;margin:20px 0}
.details-card dt{font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:2px}
.details-card dd{margin:0 0 12px 0;font-weight:500;color:#1e293b}
.details-card dd:last-child{margin-bottom:0}
.badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534}
.btn{display:inline-block;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;color:#ffffff!important;background:linear-gradient(135deg,#8B5CF6,#A855F7)}
.btn:hover{background:linear-gradient(135deg,#7C3AED,#9333EA)}
.quote-card{background:#fffbeb;border-left:4px solid #F97316;border-radius:8px;padding:16px 20px;margin:20px 0;font-style:italic;color:#475569}
.email-footer{background:#1e293b;padding:32px;text-align:center}
.email-footer p{color:#94a3b8;font-size:12px;margin:4px 0;line-height:1.8}
.email-footer .company-name{color:#e2e8f0;font-size:14px;font-weight:600}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
.animate-fade-in{animation:fadeIn 0.6s ease-out}
.animate-pulse{animation:pulse 2s ease-in-out infinite}
@media screen and (max-width:600px){
.email-header{padding:30px 20px}
.email-body{padding:24px 20px}
.email-footer{padding:24px 20px}
}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td align="center" style="padding:20px 10px">
<div class="email-container">
<div class="email-header">
<div class="stars">✦ ✦ ✦</div>
<h1>VyomAi</h1>
<p class="tagline">Pioneering AI Solutions from Nepal</p>
</div>
<div class="divider"></div>
<div class="email-body animate-fade-in">
${contentHtml}
</div>
<div class="divider"></div>
<div class="email-footer">
<p class="company-name">VyomAi Cloud Pvt. Ltd</p>
<p>Tokha, Kathmandu, Nepal</p>
<p><a href="mailto:info@vyomai.cloud" style="color:#94a3b8;text-decoration:none">info@vyomai.cloud</a></p>
<p style="margin-top:12px;font-size:11px;color:#64748b">Crafted in Kathmandu • Deployed Globally</p>
<p style="margin-top:8px;font-size:11px;color:#475569">This is an automated message from VyomAi. Please do not reply directly.</p>
</div>
</div>
</td>
</tr>
</table>
</body>
</html>`;
}

function userBookingConfirmation(name: string, email: string, company: string, message?: string): string {
  return `
<h2>✦ Booking Confirmed!</h2>
<p>Dear ${escapeHtml(name)},</p>
<p>Thank you for choosing <strong>VyomAi Cloud Pvt. Ltd</strong>. We are thrilled to inform you that your booking request has been received successfully. <span style="font-size:18px">✓</span></p>
<div class="details-card">
<dl>
<dt>Name</dt>
<dd>${escapeHtml(name)}</dd>
<dt>Email</dt>
<dd>${escapeHtml(email)}</dd>
<dt>Company / Personal</dt>
<dd>${escapeHtml(company)}</dd>
${message ? `<dt>Your Message</dt>\n<dd>${escapeHtml(message)}</dd>` : ""}
</dl>
</div>
<p>Our dedicated team will review your request and reach out to you within <strong>24 hours</strong> to discuss the next steps and how we can bring your vision to life.</p>
<p style="margin-top:24px">We look forward to collaborating with you!</p>
<p style="margin-top:20px">Warm regards,<br><strong>The VyomAi Team</strong></p>
`;
}

function adminBookingNotification(name: string, email: string, company: string, message: string | undefined, adminUrl?: string): string {
  const dashboardUrl = adminUrl || "https://vyomai.cloud/admin/inquiries";
  return `
<h2>✦ New Booking Request</h2>
<p>A new booking request has been submitted through the website. <span class="badge">Action Required</span></p>
<div class="details-card">
<dl>
<dt>Name</dt>
<dd>${escapeHtml(name)}</dd>
<dt>Email</dt>
<dd><a href="mailto:${escapeHtml(email)}" style="color:#8B5CF6">${escapeHtml(email)}</a></dd>
<dt>Company / Personal</dt>
<dd>${escapeHtml(company)}</dd>
${message ? `<dt>Message</dt>\n<dd>${escapeHtml(message)}</dd>` : ""}
</dl>
</div>
<div style="text-align:center;margin-top:24px">
<a href="${dashboardUrl}" class="btn">View in Dashboard</a>
</div>
<p style="margin-top:16px;font-size:13px;color:#64748b">Please contact the customer within 24 hours to discuss their requirements.</p>
`;
}

function userContactConfirmation(name: string, message: string): string {
  return `
<h2>✦ Thank You for Reaching Out!</h2>
<p>Dear ${escapeHtml(name)},</p>
<p>Thank you for contacting <strong>VyomAi Cloud Pvt. Ltd</strong>. We have received your message and truly appreciate your interest in our services.</p>
<div class="quote-card">
<p style="margin:0">"${escapeHtml(message)}"</p>
</div>
<p>Our team is reviewing your inquiry and will get back to you within <strong>24 hours</strong>. For urgent matters, feel free to reach out to us directly at <strong><a href="mailto:info@vyomai.cloud" style="color:#8B5CF6;text-decoration:none">info@vyomai.cloud</a></strong>.</p>
<p>We are excited to help you on your AI journey!</p>
<p style="margin-top:20px">With gratitude,<br><strong>The VyomAi Team</strong></p>
`;
}

function adminContactNotification(name: string, email: string, subject: string | undefined, message: string, adminUrl?: string): string {
  const dashboardUrl = adminUrl || "https://vyomai.cloud/admin/inquiries";
  return `
<h2>✦ New Contact Form Submission</h2>
<p>A new message has been submitted through the website contact form. <span class="badge">Action Required</span></p>
<div class="details-card">
<dl>
<dt>Name</dt>
<dd>${escapeHtml(name)}</dd>
<dt>Email</dt>
<dd><a href="mailto:${escapeHtml(email)}" style="color:#8B5CF6">${escapeHtml(email)}</a></dd>
${subject ? `<dt>Subject</dt>\n<dd>${escapeHtml(subject)}</dd>` : ""}
<dt>Message</dt>
<dd>${escapeHtml(message)}</dd>
</dl>
</div>
<div style="text-align:center;margin-top:24px">
<a href="${dashboardUrl}" class="btn">View in Dashboard</a>
</div>
`;
}

function userProjectConfirmation(name: string, description: string): string {
  return `
<h2>✦ Project Inquiry Received!</h2>
<p>Dear ${escapeHtml(name)},</p>
<p>Thank you for sharing your project vision with <strong>VyomAi Cloud Pvt. Ltd</strong>. We are genuinely excited to learn about your ideas and explore how we can contribute.</p>
<div class="quote-card">
<p style="margin:0">"${escapeHtml(description)}"</p>
</div>
<p>Our team of experts will carefully review your project requirements and reach out to you within <strong>24 hours</strong> to discuss how we can bring your vision to life. Every great solution starts with a conversation — and we can't wait to have that conversation with you.</p>
<p style="margin-top:20px">With enthusiasm,<br><strong>The VyomAi Team</strong></p>
`;
}

function adminProjectNotification(name: string, email: string, budget: string | undefined, description: string, adminUrl?: string): string {
  const dashboardUrl = adminUrl || "https://vyomai.cloud/admin/inquiries";
  return `
<h2>✦ New Project Discussion Inquiry</h2>
<p>A new project discussion request has been submitted. <span class="badge">Action Required</span></p>
<div class="details-card">
<dl>
<dt>Name</dt>
<dd>${escapeHtml(name)}</dd>
<dt>Email</dt>
<dd><a href="mailto:${escapeHtml(email)}" style="color:#8B5CF6">${escapeHtml(email)}</a></dd>
${budget ? `<dt>Budget</dt>\n<dd>${escapeHtml(budget)}</dd>` : ""}
<dt>Project Description</dt>
<dd>${escapeHtml(description)}</dd>
</dl>
</div>
<div style="text-align:center;margin-top:24px">
<a href="${dashboardUrl}" class="btn">View in Dashboard</a>
</div>
`;
}

function passwordResetEmail(verificationCode: string): string {
  return `
<h2>✦ Password Reset Request</h2>
<p>You requested to reset your admin password for <strong>VyomAi</strong> admin panel.</p>
<div style="text-align:center;margin:28px 0">
<div style="display:inline-block;background:#f0f0ff;border:2px dashed #8B5CF6;border-radius:12px;padding:16px 32px">
<span style="font-size:32px;font-weight:700;color:#8B5CF6;letter-spacing:8px;font-family:monospace">${escapeHtml(verificationCode)}</span>
</div>
</div>
<p>This code expires in <strong>15 minutes</strong>. Do not share this code with anyone.</p>
<p style="margin-top:16px;font-size:13px;color:#64748b">If you didn't request this password reset, you can safely ignore this email.</p>
<p style="margin-top:20px">— The VyomAi Team</p>
`;
}

function pricingRequestCustomerConfirmation(name: string, packageName: string, estimatedPrice: string, currency: string, mobileNumber: string): string {
  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", INR: "₹", NPR: "₨" };
  const symbol = currencySymbols[currency] || "$";
  return `
<h2>✦ Custom Pricing Request Received!</h2>
<p>Dear ${escapeHtml(name)},</p>
<p>Thank you for your interest in our <strong>${escapeHtml(packageName)}</strong> package with custom requirements. We have received your request and our team will review your specific needs.</p>
<div class="details-card">
<dl>
<dt>Package</dt>
<dd>${escapeHtml(packageName)}</dd>
<dt>Estimated Price Range</dt>
<dd><strong style="font-size:18px;color:#8B5CF6">${symbol}${estimatedPrice} ${currency}</strong></dd>
<dt>Contact Number</dt>
<dd>${escapeHtml(mobileNumber)}</dd>
</dl>
</div>
<p>Our team will contact you at <strong>${escapeHtml(mobileNumber)}</strong> within 24 hours to discuss your custom needs and provide a detailed personalized quote.</p>
<p>We look forward to helping you!</p>
<p style="margin-top:20px">Best regards,<br><strong>The VyomAi Team</strong></p>
`;
}

function pricingRequestAdminNotification(name: string, email: string, mobileNumber: string, packageName: string, request: string, estimatedPrice: number, currency: string, adminUrl?: string): string {
  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", INR: "₹", NPR: "₨" };
  const symbol = currencySymbols[currency] || "$";
  const dashboardUrl = adminUrl || "https://vyomai.cloud/admin/pricing";
  return `
<h2>✦ New Custom Pricing Request</h2>
<p>A new custom pricing request has been submitted. <span class="badge">Action Required</span></p>
<div class="details-card">
<dl>
<dt>Package</dt>
<dd>${escapeHtml(packageName)}</dd>
<dt>Name</dt>
<dd>${escapeHtml(name)}</dd>
<dt>Email</dt>
<dd><a href="mailto:${escapeHtml(email)}" style="color:#8B5CF6">${escapeHtml(email)}</a></dd>
<dt>Mobile</dt>
<dd>${escapeHtml(mobileNumber)}</dd>
<dt>Estimated Price</dt>
<dd><strong style="color:#8B5CF6">${symbol}${estimatedPrice} ${currency}</strong></dd>
<dt>Custom Requirements</dt>
<dd>${escapeHtml(request)}</dd>
</dl>
</div>
<div style="text-align:center;margin-top:24px">
<a href="${dashboardUrl}" class="btn">View in Dashboard</a>
</div>
<p style="margin-top:16px;font-size:13px;color:#64748b">Please contact the customer to discuss their custom needs and provide a detailed quote.</p>
`;
}

export {
  buildEmailWrapper,
  userBookingConfirmation,
  adminBookingNotification,
  userContactConfirmation,
  adminContactNotification,
  userProjectConfirmation,
  adminProjectNotification,
  passwordResetEmail,
  pricingRequestCustomerConfirmation,
  pricingRequestAdminNotification,
};
