import { z } from "zod";

export const users = {
  id: "",
  username: "",
  password: "",
  email: "",
  twoFactorSecret: "",
  twoFactorEnabled: false,
  twoFactorMethod: "none" as "none" | "email" | "totp" | "both",
  googleId: "",
};

export const insertUserSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
  email: z.string().email().max(254).optional(),
  role: z.enum(["vyom_admin", "admin", "ai_agent"]).optional().default("admin"),
  permissions: z.string().max(1000).optional(),
  twoFactorSecret: z.string().max(500).optional(),
  twoFactorEnabled: z.boolean().optional().default(false),
  twoFactorMethod: z.enum(["none", "email", "totp", "both"]).optional().default("none"),
  googleId: z.string().max(500).optional(),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type VerifyResetCode = z.infer<typeof verifyResetCodeSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string; email?: string; role?: string; permissions?: string; twoFactorSecret?: string; twoFactorEnabled?: boolean; twoFactorMethod?: "none" | "email" | "totp" | "both"; googleId?: string; createdAt?: Date | string };

export const articleSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  summary: z.string().max(5000).optional(),
  tags: z.string().max(2000).optional(),
  type: z.enum(["article", "video", "demo"]),
  mediaUrl: z.string().max(2000).optional(),
  thumbnailUrl: z.string().max(2000).optional(),
  published: z.boolean(),
  createdAt: z.string(),
  createdBy: z.string().max(100).optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().max(100).optional(),
});

export const insertArticleSchema = articleSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Article = z.infer<typeof articleSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export const siteSettingsSchema = z.object({
  companyName: z.string().min(1).max(200),
  tagline: z.string().min(1).max(300),
  email: z.string().email(),
  address: z.string().min(1).max(500),
  phone: z.string().max(50).optional(),
  aboutText: z.string().min(1).max(5000),
  missionText: z.string().min(1).max(2000),
  logoUrl: z.string().max(2000).optional(),
  paymentEnabled: z.boolean(),
  comingSoonEnabled: z.boolean().optional(),
  comingSoonTitle: z.string().max(200).optional(),
  comingSoonMessage: z.string().max(1000).optional(),
  quickLinks: z.array(z.object({
    title: z.string().min(1).max(100),
    url: z.string().max(2000),
  })).max(20).optional(),
  socialLinks: z.object({
    linkedin: z.string().max(2000).optional(),
    instagram: z.string().max(2000).optional(),
    facebook: z.string().max(2000).optional(),
    whatsapp: z.string().max(2000).optional(),
    viber: z.string().max(2000).optional(),
    youtube: z.string().max(2000).optional(),
  }),
  socialMediaEnabled: z.object({
    linkedin: z.boolean().optional().default(true),
    instagram: z.boolean().optional().default(true),
    facebook: z.boolean().optional().default(true),
    whatsapp: z.boolean().optional().default(true),
    viber: z.boolean().optional().default(true),
    youtube: z.boolean().optional().default(true),
  }).optional().default({}),
  // Section visibility toggles
  showHomeSection: z.boolean().optional().default(true),
  showAboutSection: z.boolean().optional().default(true),
  showServicesSection: z.boolean().optional().default(true),
  showSolutionsSection: z.boolean().optional().default(true),
  showMediaSection: z.boolean().optional().default(true),
  showContactSection: z.boolean().optional().default(true),
  // Footer settings
  footerContactEmail: z.string().email().max(254).optional(),
  footerMobileNumber: z.string().max(50).optional(),
  footerAddress: z.string().max(500).optional(),
  publishFooter: z.boolean().optional().default(false),
  // Section visibility toggles for new sections
  showTeamSection: z.boolean().optional().default(true),
  showPricingSection: z.boolean().optional().default(true),
  showProjectDiscussionSection: z.boolean().optional().default(true),
  showFaqSection: z.boolean().optional().default(true),
  showTestimonialsSection: z.boolean().optional().default(true),
  // Booking bot toggle
  bookingBotEnabled: z.boolean().optional().default(true),
  // Currency exchange rates (stored as JSON)
  exchangeRates: z.object({
    USD: z.number().default(1),
    EUR: z.number().default(0.92),
    INR: z.number().default(83.12),
    NPR: z.number().default(132.5),
  }).optional().default({
    USD: 1,
    EUR: 0.92,
    INR: 83.12,
    NPR: 132.5,
  }),
  // Last exchange rate update timestamp
  exchangeRatesUpdatedAt: z.string().optional(),
  // Default currency for pricing display
  defaultCurrency: z.enum(["USD", "EUR", "INR", "NPR"]).optional().default("NPR"),
  // Welcome Popup Settings
  welcomePopupEnabled: z.boolean().optional().default(false),
  welcomePopupTitle: z.string().max(200).optional().default("Welcome to VyomAi"),
  welcomePopupMessage: z.string().max(1000).optional().default("Experience the future of AI solutions"),
  welcomePopupImageUrl: z.string().max(2000).optional(),
  welcomePopupButtonText: z.string().max(100).optional().default("Explore Now"),
  welcomePopupAnimationStyle: z.enum(["fade", "slide", "zoom", "glow", "bounce", "confetti", "sparkle", "gradient-wave", "pulse-ring"]).optional().default("fade"),
  welcomePopupDismissable: z.boolean().optional().default(true),
  // AI Greeting Settings
  aiGreetingEnabled: z.boolean().optional().default(false),
  aiGreetingText: z.string().max(1000).optional().default(""),
  // Email Provider Configuration (Resend SMTP)
  emailProvider: z.enum(["smtp"]).optional().default("smtp"),
  emailFromName: z.string().max(100).optional().default("VyomAi"),
  emailFromAddress: z.string().email().optional().default("info@vyomai.cloud"),
  emailReplyTo: z.string().email().optional(),
  // SMTP Settings (Resend)
  smtpHost: z.string().max(255).optional(),
  smtpPort: z.string().max(10).optional().default("587"),
  smtpUser: z.string().max(255).optional(),
  smtpPassword: z.string().max(255).optional(),
  smtpSecure: z.boolean().optional().default(false),
  emailFeaturesEnabled: z.boolean().optional().default(true),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

// Popup Form Schema
export const popupFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  formType: z.enum(["email_collection", "appointment", "holiday_greeting", "welcome", "coming_soon", "custom"]),
  title: z.string().min(1).max(500),
  message: z.string().max(2000).optional(),
  buttonText: z.string().max(100).optional().default("Submit"),
  buttonLink: z.string().max(2000).optional(),
  imageUrl: z.string().max(2000).optional(),
  animationStyle: z.enum(["fade", "slide", "bounce", "confetti", "sparkle", "gradient-wave", "glow", "pulse-ring"]).optional().default("fade"),
  enabled: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
  showOnLoad: z.boolean().optional().default(true),
  showDelay: z.string().optional().default("0"),
  dismissable: z.boolean().optional().default(true),
  collectEmail: z.boolean().optional().default(false),
  collectPhone: z.boolean().optional().default(false),
  collectName: z.boolean().optional().default(false),
  successMessage: z.string().optional().default("Thank you!"),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertPopupFormSchema = popupFormSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type PopupForm = z.infer<typeof popupFormSchema>;
export type InsertPopupForm = z.infer<typeof insertPopupFormSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const visitorStatsSchema = z.object({
  totalVisitors: z.number(),
  todayVisitors: z.number(),
  hourlyData: z.array(z.object({
    hour: z.string(),
    visitors: z.number(),
  })).optional(),
  trafficSources: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })).optional(),
  deviceTypes: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })).optional(),
  engagementMetrics: z.array(z.object({
    metric: z.string(),
    value: z.number(),
  })).optional(),
  topPages: z.array(z.object({
    page: z.string(),
    views: z.number(),
  })).optional(),
  socialMediaStats: z.array(z.object({
    platform: z.string(),
    likes: z.number().optional().default(0),
    shares: z.number().optional().default(0),
    comments: z.number().optional().default(0),
    impressions: z.number().optional().default(0),
  })).optional(),
});

export type VisitorStats = z.infer<typeof visitorStatsSchema>;

export const serviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().max(2000),
  avatarType: z.enum(["custom", "ai-generated"]).optional().default("custom"),
  aiAvatarStyle: z.string().max(500).optional(),
  animationEnabled: z.boolean().optional().default(true),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertTeamMemberSchema = teamMemberSchema.omit({ id: true, createdAt: true });

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export const pricingPackageSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(1000000).optional(),
  monthlyPrice: z.number().min(0).max(1000000).optional(),
  yearlyPrice: z.number().min(0).max(1000000).optional(),
  oneTimeContactEmail: z.string().email().max(254).optional(),
  contactMessage: z.string().max(500).optional().default("Contact VyomAi for Premium Package"),
  floatingCloudEnabled: z.boolean().optional().default(true),
  baseCurrency: z.enum(["USD", "EUR", "INR", "NPR"]).default("NPR"),
  description: z.string().min(1).max(2000),
  features: z.array(z.string().min(1).max(500)).min(1).max(50),
  highlighted: z.boolean().optional(),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertPricingPackageSchema = pricingPackageSchema.omit({ id: true, createdAt: true });

export type PricingPackage = z.infer<typeof pricingPackageSchema>;
export type InsertPricingPackage = z.infer<typeof insertPricingPackageSchema>;

// One-time pricing request schema for storing customer inquiries
export const oneTimePricingRequestSchema = z.object({
  id: z.string(),
  packageId: z.string().max(200),
  packageName: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  mobileNumber: z.string().max(50).regex(/^[\d\s\+\-\(\)]{5,50}$/),
  request: z.string().min(1).max(5000),
  estimatedPrice: z.number().min(0).max(10000000),
  currency: z.string().max(10),
  status: z.enum(["pending", "contacted", "converted"]).optional().default("pending"),
  createdAt: z.string().optional(),
});

export const insertOneTimePricingRequestSchema = oneTimePricingRequestSchema.omit({ id: true, createdAt: true });

export type OneTimePricingRequest = z.infer<typeof oneTimePricingRequestSchema>;
export type InsertOneTimePricingRequest = z.infer<typeof insertOneTimePricingRequestSchema>;

export const projectDiscussionSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  contactEmail: z.string().email().max(254).optional(),
  createdAt: z.string().optional(),
});

export const insertProjectDiscussionSchema = projectDiscussionSchema.omit({ id: true, createdAt: true });

export type ProjectDiscussion = z.infer<typeof projectDiscussionSchema>;
export type InsertProjectDiscussion = z.infer<typeof insertProjectDiscussionSchema>;

export const bookingRequestSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  companyOrPersonal: z.string().min(1).max(200),
  message: z.string().max(5000).optional(),
  status: z.enum(["created", "open", "ongoing", "completed"]).optional().default("created"),
  dueDate: z.string().optional(),
  createdAt: z.string().optional(),
});

export const insertBookingRequestSchema = bookingRequestSchema.omit({ id: true, createdAt: true });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;

export const socialMediaAnalyticsSchema = z.object({
  id: z.string(),
  platform: z.enum(["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"]),
  engagementRate: z.number().optional().default(0),
  followersCount: z.number().optional().default(0),
  postsCount: z.number().optional().default(0),
  impressions: z.number().optional().default(0),
  likes: z.number().optional().default(0),
  shares: z.number().optional().default(0),
  comments: z.number().optional().default(0),
  createdAt: z.string().optional(),
});

export const insertSocialMediaAnalyticsSchema = socialMediaAnalyticsSchema.omit({ id: true, createdAt: true });

export type SocialMediaAnalytics = z.infer<typeof socialMediaAnalyticsSchema>;
export type InsertSocialMediaAnalytics = z.infer<typeof insertSocialMediaAnalyticsSchema>;

export const socialMediaIntegrationSchema = z.object({
  id: z.string(),
  platform: z.enum(["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"]),
  isConnected: z.boolean().optional().default(false),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertSocialMediaIntegrationSchema = socialMediaIntegrationSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type SocialMediaIntegration = z.infer<typeof socialMediaIntegrationSchema>;
export type InsertSocialMediaIntegration = z.infer<typeof insertSocialMediaIntegrationSchema>;

export const customerInquirySchema = z.object({
  id: z.string(),
  inquiryType: z.enum(["custom_solution", "booking", "project_discussion", "contact"]),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(50).optional(),
  subject: z.string().max(500).optional(),
  message: z.string().min(1).max(10000),
  company: z.string().max(200).optional(),
  status: z.enum(["new", "contacted", "resolved"]).optional().default("new"),
  createdAt: z.string().optional(),
});

export const insertCustomerInquirySchema = customerInquirySchema.omit({ id: true, createdAt: true });

export type CustomerInquiry = z.infer<typeof customerInquirySchema>;
export type InsertCustomerInquiry = z.infer<typeof insertCustomerInquirySchema>;

export const heroContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().max(200).optional(),
  titleLine1: z.string().max(200).optional(),
  titleLine2: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  primaryButtonText: z.string().max(100).optional(),
  primaryButtonLink: z.string().max(2000).optional(),
  secondaryButtonText: z.string().max(100).optional(),
  secondaryButtonLink: z.string().max(2000).optional(),
  backgroundStyle: z.string().max(50).optional(),
  enabled: z.boolean().optional().default(true),
  updatedAt: z.string().optional(),
});

export const insertHeroContentSchema = heroContentSchema.omit({ id: true, updatedAt: true });

export type HeroContent = z.infer<typeof heroContentSchema>;
export type InsertHeroContent = z.infer<typeof insertHeroContentSchema>;

export const aboutContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().max(200).optional(),
  titleHighlight: z.string().max(200).optional(),
  titleNormal: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  enabled: z.boolean().optional().default(true),
  updatedAt: z.string().optional(),
});

export const insertAboutContentSchema = aboutContentSchema.omit({ id: true, updatedAt: true });

export type AboutContent = z.infer<typeof aboutContentSchema>;
export type InsertAboutContent = z.infer<typeof insertAboutContentSchema>;

export const aboutValueSchema = z.object({
  id: z.string(),
  icon: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  order: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertAboutValueSchema = aboutValueSchema.omit({ id: true, createdAt: true });

export type AboutValue = z.infer<typeof aboutValueSchema>;
export type InsertAboutValue = z.infer<typeof insertAboutValueSchema>;

export const servicesContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().max(200).optional(),
  titleHighlight: z.string().max(200).optional(),
  titleNormal: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  enabled: z.boolean().optional().default(true),
  updatedAt: z.string().optional(),
});

export const insertServicesContentSchema = servicesContentSchema.omit({ id: true, updatedAt: true });

export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type InsertServicesContent = z.infer<typeof insertServicesContentSchema>;

export const serviceItemSchema = z.object({
  id: z.string(),
  icon: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  order: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertServiceItemSchema = serviceItemSchema.omit({ id: true, createdAt: true });

export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;

export const solutionsContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().max(200).optional(),
  titleHighlight: z.string().max(200).optional(),
  titleNormal: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  enabled: z.boolean().optional().default(true),
  updatedAt: z.string().optional(),
});

export const insertSolutionsContentSchema = solutionsContentSchema.omit({ id: true, updatedAt: true });

export type SolutionsContent = z.infer<typeof solutionsContentSchema>;
export type InsertSolutionsContent = z.infer<typeof insertSolutionsContentSchema>;

export const solutionItemSchema = z.object({
  id: z.string(),
  icon: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  features: z.array(z.string().max(500)).optional(),
  gradientFrom: z.string().max(100).optional(),
  gradientTo: z.string().max(100).optional(),
  order: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertSolutionItemSchema = solutionItemSchema.omit({ id: true, createdAt: true });

export type SolutionItem = z.infer<typeof solutionItemSchema>;
export type InsertSolutionItem = z.infer<typeof insertSolutionItemSchema>;

export const testimonialSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional().default(""),
  role: z.string().max(200).optional().default(""),
  avatarUrl: z.string().max(2000).optional().default(""),
  content: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional().default(5),
  order: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertTestimonialSchema = testimonialSchema.omit({ id: true, createdAt: true });

export type Testimonial = z.infer<typeof testimonialSchema>;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export const faqSchema = z.object({
  id: z.string(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  order: z.number().optional().default(0),
  category: z.string().max(100).optional().default("general"),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertFaqSchema = faqSchema.omit({ id: true, createdAt: true });

export type Faq = z.infer<typeof faqSchema>;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export const uploadedFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  uploadedAt: z.string(),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export const verify2faSchema = z.object({
  method: z.enum(["email", "totp"]),
  code: z.string().min(1).max(10),
  sessionId: z.string().min(1),
});

export type Verify2FA = z.infer<typeof verify2faSchema>;

export const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

export type GoogleAuth = z.infer<typeof googleAuthSchema>;

export const twoFactorSettingsSchema = z.object({
  twoFactorMethod: z.enum(["none", "email", "totp", "both"]),
});

export type TwoFactorSettings = z.infer<typeof twoFactorSettingsSchema>;

// Lead schema for the Lead Management module
export const leadSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  website: z.string().max(500).optional(),
  industry: z.string().max(200).optional(),
  source: z.enum(["website_form", "booking", "project_discussion", "custom_solution", "manual_entry", "ai_generated"]),
  vyomaiService: z.enum(["ai_solutions", "web_development", "digital_marketing", "seo", "social_media", "content_creation", "consulting", "other"]).optional(),
  status: z.enum(["new", "qualified", "contacted", "converted", "lost"]).default("new"),
  score: z.number().min(0).max(100).optional(),
  intent: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  assignedTo: z.string().optional(),
  assignedByName: z.string().optional(),
  sourceInquiryId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertLeadSchema = leadSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Lead = z.infer<typeof leadSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export const leadUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  website: z.string().max(500).optional(),
  industry: z.string().max(200).optional(),
  source: z.enum(["website_form", "booking", "project_discussion", "custom_solution", "manual_entry", "ai_generated"]).optional(),
  vyomaiService: z.enum(["ai_solutions", "web_development", "digital_marketing", "seo", "social_media", "content_creation", "consulting", "other"]).optional(),
  status: z.enum(["new", "qualified", "contacted", "converted", "lost"]).optional(),
  score: z.number().min(0).max(100).optional(),
  intent: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  assignedTo: z.string().optional(),
  assignedByName: z.string().optional(),
});

export type LeadUpdate = z.infer<typeof leadUpdateSchema>;
