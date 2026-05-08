import { z } from "zod";

export const users = {
  id: "",
  username: "",
  password: "",
  email: "",
  twoFactorSecret: "",
  twoFactorEnabled: false,
};

export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email().optional(),
  role: z.enum(["vyom_admin", "admin", "ai_agent"]).optional().default("admin"),
  permissions: z.string().optional(),
  twoFactorSecret: z.string().optional(),
  twoFactorEnabled: z.boolean().optional().default(false),
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
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type VerifyResetCode = z.infer<typeof verifyResetCodeSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string; email?: string; role?: string; permissions?: string; twoFactorSecret?: string; twoFactorEnabled?: boolean; createdAt?: Date | string };

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(["article", "video", "demo"]),
  mediaUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  published: z.boolean(),
  createdAt: z.string(),
  createdBy: z.string().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const insertArticleSchema = articleSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Article = z.infer<typeof articleSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export const siteSettingsSchema = z.object({
  companyName: z.string(),
  tagline: z.string(),
  email: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  aboutText: z.string(),
  missionText: z.string(),
  logoUrl: z.string().optional(),
  paymentEnabled: z.boolean(),
  comingSoonEnabled: z.boolean().optional(),
  comingSoonTitle: z.string().optional(),
  comingSoonMessage: z.string().optional(),
  quickLinks: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).optional(),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    whatsapp: z.string().optional(),
    viber: z.string().optional(),
    youtube: z.string().optional(),
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
  footerContactEmail: z.string().optional(),
  footerMobileNumber: z.string().optional(),
  footerAddress: z.string().optional(),
  publishFooter: z.boolean().optional().default(false),
  // Section visibility toggles for new sections
  showTeamSection: z.boolean().optional().default(true),
  showPricingSection: z.boolean().optional().default(true),
  showProjectDiscussionSection: z.boolean().optional().default(true),
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
  welcomePopupTitle: z.string().optional().default("Welcome to VyomAi"),
  welcomePopupMessage: z.string().optional().default("Experience the future of AI solutions"),
  welcomePopupImageUrl: z.string().optional(),
  welcomePopupButtonText: z.string().optional().default("Explore Now"),
  welcomePopupAnimationStyle: z.enum(["fade", "slide", "zoom", "glow", "bounce", "confetti", "sparkle", "gradient-wave", "pulse-ring"]).optional().default("fade"),
  welcomePopupDismissable: z.boolean().optional().default(true),
  // Email Provider Configuration
  emailProvider: z.enum(["gmail", "smtp", "sendgrid"]).optional().default("smtp"),
  emailFromName: z.string().optional().default("VyomAi"),
  emailFromAddress: z.string().email().optional().default("info@vyomai.cloud"),
  emailReplyTo: z.string().email().optional(),
  // SMTP Settings
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional().default("587"),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().optional().default(false),
  // SendGrid Settings
  sendgridFromEmail: z.string().email().optional(),
  // Provider priority
  emailProviderPriority: z.string().optional().default("smtp,gmail,sendgrid"),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

// Popup Form Schema
export const popupFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  formType: z.enum(["email_collection", "appointment", "holiday_greeting", "welcome", "coming_soon", "custom"]),
  title: z.string(),
  message: z.string().optional(),
  buttonText: z.string().optional().default("Submit"),
  buttonLink: z.string().optional(),
  imageUrl: z.string().optional(),
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
  name: z.string(),
  role: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  avatarType: z.enum(["custom", "ai-generated"]).optional().default("custom"),
  aiAvatarStyle: z.string().optional(),
  animationEnabled: z.boolean().optional().default(true),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export const insertTeamMemberSchema = teamMemberSchema.omit({ id: true, createdAt: true });

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export const pricingPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().optional(), // Kept for backwards compatibility
  monthlyPrice: z.number().optional(),
  yearlyPrice: z.number().optional(),
  oneTimeContactEmail: z.string().email().optional(), // Email for one-time pricing inquiries - if set, enables custom pricing
  contactMessage: z.string().optional().default("Contact VyomAi for Premium Package"), // Floating element text
  floatingCloudEnabled: z.boolean().optional().default(true), // Enable/disable floating cloud animation
  baseCurrency: z.enum(["USD", "EUR", "INR", "NPR"]).default("NPR"), // All prices stored in NPR
  description: z.string(),
  features: z.array(z.string()),
  highlighted: z.boolean().optional(),
  enabled: z.boolean().optional().default(true), // Publish toggle
  createdAt: z.string().optional(),
});

export const insertPricingPackageSchema = pricingPackageSchema.omit({ id: true, createdAt: true });

export type PricingPackage = z.infer<typeof pricingPackageSchema>;
export type InsertPricingPackage = z.infer<typeof insertPricingPackageSchema>;

// One-time pricing request schema for storing customer inquiries
export const oneTimePricingRequestSchema = z.object({
  id: z.string(),
  packageId: z.string(),
  packageName: z.string(),
  name: z.string(),
  email: z.string().email(),
  mobileNumber: z.string(),
  request: z.string(),
  estimatedPrice: z.number(),
  currency: z.string(),
  status: z.enum(["pending", "contacted", "converted"]).optional().default("pending"),
  createdAt: z.string().optional(),
});

export const insertOneTimePricingRequestSchema = oneTimePricingRequestSchema.omit({ id: true, createdAt: true });

export type OneTimePricingRequest = z.infer<typeof oneTimePricingRequestSchema>;
export type InsertOneTimePricingRequest = z.infer<typeof insertOneTimePricingRequestSchema>;

export const projectDiscussionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  contactEmail: z.string().optional(),
  createdAt: z.string().optional(),
});

export const insertProjectDiscussionSchema = projectDiscussionSchema.omit({ id: true, createdAt: true });

export type ProjectDiscussion = z.infer<typeof projectDiscussionSchema>;
export type InsertProjectDiscussion = z.infer<typeof insertProjectDiscussionSchema>;

export const bookingRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  companyOrPersonal: z.string(),
  message: z.string().optional(),
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
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string(),
  company: z.string().optional(),
  status: z.enum(["new", "contacted", "resolved"]).optional().default("new"),
  createdAt: z.string().optional(),
});

export const insertCustomerInquirySchema = customerInquirySchema.omit({ id: true, createdAt: true });

export type CustomerInquiry = z.infer<typeof customerInquirySchema>;
export type InsertCustomerInquiry = z.infer<typeof insertCustomerInquirySchema>;

// Drizzle ORM table definitions
import { pgTable, varchar, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  role: varchar("role").default("admin"),
  permissions: text("permissions"),
  twoFactorSecret: varchar("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articlesTable = pgTable("articles", {
  id: varchar("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull(),
  mediaUrl: varchar("media_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamMembersTable = pgTable("team_members", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url").notNull(),
  avatarType: varchar("avatar_type").default("custom"),
  aiAvatarStyle: varchar("ai_avatar_style"),
  animationEnabled: boolean("animation_enabled").default(true),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pricingPackagesTable = pgTable("pricing_packages", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  price: text("price"),
  monthlyPrice: text("monthly_price"),
  yearlyPrice: text("yearly_price"),
  oneTimePrice: text("one_time_price"),
  oneTimeContactEmail: varchar("one_time_contact_email"),
  contactMessage: text("contact_message").default("Contact VyomAi for Premium Package"),
  floatingCloudEnabled: boolean("floating_cloud_enabled").default(true),
  baseCurrency: varchar("base_currency").default("USD"),
  description: varchar("description").notNull(),
  features: text("features").notNull(),
  highlighted: boolean("highlighted").default(false),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const oneTimePricingRequestsTable = pgTable("one_time_pricing_requests", {
  id: varchar("id").primaryKey(),
  packageId: varchar("package_id").notNull(),
  packageName: varchar("package_name").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  mobileNumber: varchar("mobile_number").notNull(),
  request: text("request").notNull(),
  estimatedPrice: text("estimated_price").notNull(),
  currency: varchar("currency").notNull(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectDiscussionTable = pgTable("project_discussion", {
  id: varchar("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  contactEmail: varchar("contact_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingRequestsTable = pgTable("booking_requests", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  companyOrPersonal: varchar("company_or_personal").notNull(),
  message: text("message"),
  status: varchar("status").default("created"),
  dueDate: varchar("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: varchar("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  tagline: varchar("tagline").notNull(),
  email: varchar("email").notNull(),
  address: varchar("address").notNull(),
  phone: varchar("phone"),
  aboutText: text("about_text").notNull(),
  missionText: text("mission_text").notNull(),
  logoUrl: varchar("logo_url"),
  paymentEnabled: boolean("payment_enabled").default(false),
  comingSoonEnabled: boolean("coming_soon_enabled").default(false),
  comingSoonTitle: varchar("coming_soon_title"),
  comingSoonMessage: text("coming_soon_message"),
  socialLinks: text("social_links").notNull(),
  showHomeSection: boolean("show_home_section").default(true),
  showAboutSection: boolean("show_about_section").default(true),
  showServicesSection: boolean("show_services_section").default(true),
  showSolutionsSection: boolean("show_solutions_section").default(true),
  showMediaSection: boolean("show_media_section").default(true),
  showContactSection: boolean("show_contact_section").default(true),
  footerLogoUrl: varchar("footer_logo_url"),
  footerContactEmail: varchar("footer_contact_email"),
  footerMobileNumber: varchar("footer_mobile_number"),
  footerAddress: varchar("footer_address"),
  publishFooter: boolean("publish_footer").default(true),
  showTeamSection: boolean("show_team_section").default(true),
  showPricingSection: boolean("show_pricing_section").default(true),
  showProjectDiscussionSection: boolean("show_project_discussion_section").default(true),
  bookingBotEnabled: boolean("booking_bot_enabled").default(true),
  exchangeRates: text("exchange_rates").default('{"USD":1,"EUR":0.92,"INR":83.12,"NPR":132.5}'),
  exchangeRatesUpdatedAt: varchar("exchange_rates_updated_at"),
  defaultCurrency: varchar("default_currency").default("NPR"),
  // Welcome Popup Settings
  welcomePopupEnabled: boolean("welcome_popup_enabled").default(false),
  welcomePopupTitle: varchar("welcome_popup_title").default("Welcome to VyomAi"),
  welcomePopupMessage: text("welcome_popup_message").default("Experience the future of AI solutions"),
  welcomePopupImageUrl: varchar("welcome_popup_image_url"),
  welcomePopupButtonText: varchar("welcome_popup_button_text").default("Explore Now"),
  welcomePopupAnimationStyle: varchar("welcome_popup_animation_style").default("fade"),
  welcomePopupDismissable: boolean("welcome_popup_dismissable").default(true),
  // Email Provider Configuration
  emailFeaturesEnabled: boolean("email_features_enabled").default(true),
  emailProvider: varchar("email_provider").default("smtp"), // 'gmail', 'smtp', 'sendgrid'
  emailFromName: varchar("email_from_name").default("VyomAi"),
  emailFromAddress: varchar("email_from_address").default("info@vyomai.cloud"),
  emailReplyTo: varchar("email_reply_to"),
  // SMTP Settings (non-secret fields only)
  smtpHost: varchar("smtp_host"),
  smtpPort: varchar("smtp_port").default("587"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: varchar("smtp_password"), // Added for UI configuration
  smtpSecure: boolean("smtp_secure").default(false),
  // SendGrid Settings (non-secret fields only)
  sendgridFromEmail: varchar("sendgrid_from_email"),
  // Provider priority order (comma-separated: e.g., "smtp,gmail,sendgrid")
  emailProviderPriority: varchar("email_provider_priority").default("smtp,gmail,sendgrid"),
  // Provider health status (JSON: {"smtp": true, "gmail": false, "sendgrid": true})
  emailProviderHealth: text("email_provider_health").default('{}'),
});

export const visitorStatsTable = pgTable("visitor_stats", {
  id: varchar("id").primaryKey(),
  totalVisitors: text("total_visitors").notNull(),
  todayVisitors: text("today_visitors").notNull(),
  hourlyData: text("hourly_data"),
  trafficSources: text("traffic_sources"),
  deviceTypes: text("device_types"),
  engagementMetrics: text("engagement_metrics"),
  topPages: text("top_pages"),
  socialMediaStats: text("social_media_stats"),
});

export const socialMediaAnalyticsTable = pgTable("social_media_analytics", {
  id: varchar("id").primaryKey(),
  platform: varchar("platform").notNull().unique(),
  engagementRate: integer("engagement_rate").default(0),
  followersCount: integer("followers_count").default(0),
  postsCount: integer("posts_count").default(0),
  impressions: integer("impressions").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const socialMediaIntegrationsTable = pgTable("social_media_integrations", {
  id: varchar("id").primaryKey(),
  platform: varchar("platform").notNull().unique(),
  isConnected: boolean("is_connected").default(false),
  accessToken: varchar("access_token"),
  refreshToken: varchar("refresh_token"),
  accountId: varchar("account_id"),
  accountName: varchar("account_name"),
  profileUrl: varchar("profile_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customerInquiriesTable = pgTable("customer_inquiries", {
  id: varchar("id").primaryKey(),
  inquiryType: varchar("inquiry_type").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  subject: varchar("subject"),
  message: text("message").notNull(),
  company: varchar("company"),
  status: varchar("status").default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Popup Forms - Marketing popups for different purposes
export const popupFormsTable = pgTable("popup_forms", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  formType: varchar("form_type").notNull(), // email_collection, appointment, holiday_greeting, welcome, coming_soon, custom
  title: varchar("title").notNull(),
  message: text("message"),
  buttonText: varchar("button_text").default("Submit"),
  buttonLink: varchar("button_link"),
  imageUrl: varchar("image_url"),
  animationStyle: varchar("animation_style").default("fade"), // fade, slide, bounce, confetti, sparkle, gradient-wave, glow, pulse-ring
  enabled: boolean("enabled").default(false),
  isDefault: boolean("is_default").default(false),
  showOnLoad: boolean("show_on_load").default(true),
  showDelay: varchar("show_delay").default("0"), // seconds
  dismissable: boolean("dismissable").default(true),
  collectEmail: boolean("collect_email").default(false),
  collectPhone: boolean("collect_phone").default(false),
  collectName: boolean("collect_name").default(false),
  successMessage: varchar("success_message").default("Thank you!"),
  backgroundColor: varchar("background_color"),
  textColor: varchar("text_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============== HOME PAGE CONTENT SCHEMAS ==============

// Hero Section Content
export const heroContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().default("Pioneering AI Solutions from Nepal"),
  titleLine1: z.string().default("Transform Your"),
  titleLine2: z.string().default("Business with AI"),
  subtitle: z.string().default("We build intelligent AI agents and seamlessly integrate with Google, Microsoft, and enterprise platforms. Share knowledge, empower your team, and grow together."),
  primaryButtonText: z.string().default("Get Started"),
  primaryButtonLink: z.string().default("#contact"),
  secondaryButtonText: z.string().default("Watch Demo"),
  secondaryButtonLink: z.string().default("#media"),
  backgroundStyle: z.enum(["particles", "gradient", "image"]).default("particles"),
  backgroundImageUrl: z.string().optional(),
  enabled: z.boolean().default(true),
  updatedAt: z.string().optional(),
});

export const insertHeroContentSchema = heroContentSchema.omit({ id: true, updatedAt: true });
export type HeroContent = z.infer<typeof heroContentSchema>;
export type InsertHeroContent = z.infer<typeof insertHeroContentSchema>;

// About Section Content
export const aboutContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().default("About VyomAi"),
  titleHighlight: z.string().default("Pioneering AI"),
  titleNormal: z.string().default(" in Nepal"),
  description: z.string().default("VyomAi Cloud Pvt. Ltd is a startup company dedicated to AI technology research and development. Based in Tokha, Kathmandu, Nepal, we work tirelessly to provide the best AI product solutions and consulting services for organizations seeking to embrace the future."),
  enabled: z.boolean().default(true),
  updatedAt: z.string().optional(),
});

export const insertAboutContentSchema = aboutContentSchema.omit({ id: true, updatedAt: true });
export type AboutContent = z.infer<typeof aboutContentSchema>;
export type InsertAboutContent = z.infer<typeof insertAboutContentSchema>;

// About Value Cards
export const aboutValueSchema = z.object({
  id: z.string(),
  icon: z.string().default("Target"),
  title: z.string(),
  description: z.string(),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export const insertAboutValueSchema = aboutValueSchema.omit({ id: true, createdAt: true });
export type AboutValue = z.infer<typeof aboutValueSchema>;
export type InsertAboutValue = z.infer<typeof insertAboutValueSchema>;

// Services Section Content
export const servicesContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().default("Our Services"),
  titleNormal: z.string().default("What We "),
  titleHighlight: z.string().default("Offer"),
  description: z.string().default("Comprehensive AI solutions designed to transform how your organization works, from automation to intelligent analytics."),
  enabled: z.boolean().default(true),
  updatedAt: z.string().optional(),
});

export const insertServicesContentSchema = servicesContentSchema.omit({ id: true, updatedAt: true });
export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type InsertServicesContent = z.infer<typeof insertServicesContentSchema>;

// Service Items
export const serviceItemSchema = z.object({
  id: z.string(),
  icon: z.string().default("Bot"),
  title: z.string(),
  description: z.string(),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export const insertServiceItemSchema = serviceItemSchema.omit({ id: true, createdAt: true });
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;

// Solutions Section Content
export const solutionsContentSchema = z.object({
  id: z.string(),
  badgeText: z.string().default("AI Solutions"),
  titleHighlight: z.string().default("Enterprise"),
  titleNormal: z.string().default(" Integrations"),
  description: z.string().default("Connect AI capabilities with the platforms you already use. Transform your workflows without disrupting your team."),
  enabled: z.boolean().default(true),
  updatedAt: z.string().optional(),
});

export const insertSolutionsContentSchema = solutionsContentSchema.omit({ id: true, updatedAt: true });
export type SolutionsContent = z.infer<typeof solutionsContentSchema>;
export type InsertSolutionsContent = z.infer<typeof solutionsContentSchema>;

// Solution Items
export const solutionItemSchema = z.object({
  id: z.string(),
  icon: z.string().default("Globe"),
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()).default([]),
  gradientFrom: z.string().default("blue-500/20"),
  gradientTo: z.string().default("green-500/20"),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export const insertSolutionItemSchema = solutionItemSchema.omit({ id: true, createdAt: true });
export type SolutionItem = z.infer<typeof solutionItemSchema>;
export type InsertSolutionItem = z.infer<typeof insertSolutionItemSchema>;

// Drizzle ORM table definitions for home page content
export const heroContentTable = pgTable("hero_content", {
  id: varchar("id").primaryKey(),
  badgeText: varchar("badge_text").default("Pioneering AI Solutions from Nepal"),
  titleLine1: varchar("title_line1").default("Transform Your"),
  titleLine2: varchar("title_line2").default("Business with AI"),
  subtitle: text("subtitle"),
  primaryButtonText: varchar("primary_button_text").default("Get Started"),
  primaryButtonLink: varchar("primary_button_link").default("#contact"),
  secondaryButtonText: varchar("secondary_button_text").default("Watch Demo"),
  secondaryButtonLink: varchar("secondary_button_link").default("#media"),
  backgroundStyle: varchar("background_style").default("particles"),
  backgroundImageUrl: varchar("background_image_url"),
  enabled: boolean("enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aboutContentTable = pgTable("about_content", {
  id: varchar("id").primaryKey(),
  badgeText: varchar("badge_text").default("About VyomAi"),
  titleHighlight: varchar("title_highlight").default("Pioneering AI"),
  titleNormal: varchar("title_normal").default(" in Nepal"),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aboutValuesTable = pgTable("about_values", {
  id: varchar("id").primaryKey(),
  icon: varchar("icon").default("Target"),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  order: text("display_order").default("0"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const servicesContentTable = pgTable("services_content", {
  id: varchar("id").primaryKey(),
  badgeText: varchar("badge_text").default("Our Services"),
  titleNormal: varchar("title_normal").default("What We "),
  titleHighlight: varchar("title_highlight").default("Offer"),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceItemsTable = pgTable("service_items", {
  id: varchar("id").primaryKey(),
  icon: varchar("icon").default("Bot"),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  order: text("display_order").default("0"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const solutionsContentTable = pgTable("solutions_content", {
  id: varchar("id").primaryKey(),
  badgeText: varchar("badge_text").default("AI Solutions"),
  titleHighlight: varchar("title_highlight").default("Enterprise"),
  titleNormal: varchar("title_normal").default(" Integrations"),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const solutionItemsTable = pgTable("solution_items", {
  id: varchar("id").primaryKey(),
  icon: varchar("icon").default("Globe"),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  features: text("features").default("[]"),
  gradientFrom: varchar("gradient_from").default("blue-500/20"),
  gradientTo: varchar("gradient_to").default("green-500/20"),
  order: text("display_order").default("0"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============== SOCIAL MEDIA AUTO-SYNC SCHEMAS ==============

// Social Media Sync Logs - Track sync history and errors
export const socialMediaSyncLogSchema = z.object({
  id: z.string(),
  platform: z.enum(["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube", "twitter"]),
  syncType: z.enum(["manual", "auto"]),
  status: z.enum(["success", "failed", "partial"]),
  metricsUpdated: z.array(z.string()).optional(), // Array of metric names that were updated
  errorMessage: z.string().optional(),
  syncedAt: z.string().optional(),
});

export const insertSocialMediaSyncLogSchema = socialMediaSyncLogSchema.omit({ id: true, syncedAt: true });
export type SocialMediaSyncLog = z.infer<typeof socialMediaSyncLogSchema>;
export type InsertSocialMediaSyncLog = z.infer<typeof insertSocialMediaSyncLogSchema>;

// Social Media API Configuration - Store API credentials and sync settings
export const socialMediaApiConfigSchema = z.object({
  id: z.string(),
  platform: z.enum(["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube", "twitter"]),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(), // Will be encrypted
  apiKey: z.string().optional(), // For platforms that use API keys
  webhookSecret: z.string().optional(),
  autoSyncEnabled: z.boolean().default(false),
  syncInterval: z.enum(["15m", "30m", "1h", "6h", "24h"]).default("1h"),
  isPublished: z.boolean().default(true),
  isManualMode: z.boolean().default(false),
  lastSyncAt: z.string().optional(),
  nextSyncAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertSocialMediaApiConfigSchema = socialMediaApiConfigSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type SocialMediaApiConfig = z.infer<typeof socialMediaApiConfigSchema>;
export type InsertSocialMediaApiConfig = z.infer<typeof insertSocialMediaApiConfigSchema>;

// Drizzle ORM table definitions for social media auto-sync
export const socialMediaSyncLogsTable = pgTable("social_media_sync_logs", {
  id: varchar("id").primaryKey(),
  platform: varchar("platform").notNull(),
  syncType: varchar("sync_type").notNull(), // 'manual', 'auto'
  status: varchar("status").notNull(), // 'success', 'failed', 'partial'
  metricsUpdated: text("metrics_updated"), // JSON array of updated metrics
  errorMessage: text("error_message"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

export const socialMediaApiConfigTable = pgTable("social_media_api_config", {
  id: varchar("id").primaryKey(),
  platform: varchar("platform").notNull().unique(),
  clientId: varchar("client_id"),
  clientSecret: text("client_secret"), // Encrypted
  apiKey: text("api_key"), // Encrypted
  webhookSecret: varchar("webhook_secret"),
  autoSyncEnabled: boolean("auto_sync_enabled").default(false),
  syncInterval: varchar("sync_interval").default("1h"), // '15m', '30m', '1h', '6h', '24h'
  isPublished: boolean("is_published").default(true),
  isManualMode: boolean("is_manual_mode").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
