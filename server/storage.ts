import { type User, type InsertUser, type Article, type InsertArticle, type SiteSettings, type VisitorStats, type TeamMember, type InsertTeamMember, type PricingPackage, type InsertPricingPackage, type ProjectDiscussion, type InsertProjectDiscussion, type BookingRequest, type InsertBookingRequest, type SocialMediaAnalytics, type InsertSocialMediaAnalytics, type SocialMediaIntegration, type InsertSocialMediaIntegration, type OneTimePricingRequest, type InsertOneTimePricingRequest, type HeroContent, type InsertHeroContent, type AboutContent, type InsertAboutContent, type AboutValue, type InsertAboutValue, type ServicesContent, type InsertServicesContent, type ServiceItem, type InsertServiceItem, type SolutionsContent, type InsertSolutionsContent, type SolutionItem, type InsertSolutionItem, type PopupForm, type InsertPopupForm } from "../shared/schema.js";
import { randomUUID } from "crypto";
import bcryptjs from "bcryptjs";
import { DatabaseStorage } from "./db-storage.js";

// Try to use database storage, fall back to memory if DB not available
let storage: any;
const isDatabaseAvailable = process.env.DATABASE_URL ? true : false;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  
  getSettings(): Promise<SiteSettings>;
  updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings>;
  
  getVisitorStats(): Promise<VisitorStats>;
  incrementVisitors(): Promise<VisitorStats>;
  resetHourlyData(): Promise<VisitorStats>;
  resetTrafficSources(): Promise<VisitorStats>;
  resetDeviceTypes(): Promise<VisitorStats>;
  resetTopPages(): Promise<VisitorStats>;
  resetEngagementMetrics(): Promise<VisitorStats>;
  resetSocialMediaStats(): Promise<VisitorStats>;
  resetTotalVisitors(): Promise<VisitorStats>;
  
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;
  
  getPricingPackages(): Promise<PricingPackage[]>;
  getPricingPackage(id: string): Promise<PricingPackage | undefined>;
  createPricingPackage(pkg: InsertPricingPackage): Promise<PricingPackage>;
  updatePricingPackage(id: string, pkg: Partial<InsertPricingPackage>): Promise<PricingPackage | undefined>;
  deletePricingPackage(id: string): Promise<boolean>;
  
  getProjectDiscussion(): Promise<ProjectDiscussion | undefined>;
  updateProjectDiscussion(data: InsertProjectDiscussion): Promise<ProjectDiscussion>;
  
  getBookingRequests(): Promise<BookingRequest[]>;
  createBookingRequest(booking: InsertBookingRequest): Promise<BookingRequest>;
  updateBookingRequest(id: string, booking: Partial<InsertBookingRequest>): Promise<BookingRequest | undefined>;
  deleteBookingRequest(id: string): Promise<boolean>;
  resetBookingRequests(): Promise<void>;
  
  getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]>;
  getSocialMediaAnalytic(platform: string): Promise<SocialMediaAnalytics | undefined>;
  updateSocialMediaAnalytics(platform: string, data: Partial<InsertSocialMediaAnalytics>): Promise<SocialMediaAnalytics>;
  resetSocialMediaAnalytics(): Promise<void>;

  getSocialMediaIntegrations(): Promise<SocialMediaIntegration[]>;
  getSocialMediaIntegration(platform: string): Promise<SocialMediaIntegration | undefined>;
  updateSocialMediaIntegration(platform: string, data: Partial<InsertSocialMediaIntegration>): Promise<SocialMediaIntegration>;
  
  createOneTimePricingRequest(request: InsertOneTimePricingRequest): Promise<OneTimePricingRequest>;
  getOneTimePricingRequests(): Promise<OneTimePricingRequest[]>;
  updateOneTimePricingRequest(id: string, request: Partial<InsertOneTimePricingRequest>): Promise<OneTimePricingRequest | undefined>;
  deleteOneTimePricingRequest(id: string): Promise<boolean>;
  
  // Home Page Content Management
  getHeroContent(): Promise<HeroContent | undefined>;
  updateHeroContent(data: Partial<InsertHeroContent>): Promise<HeroContent>;
  
  getAboutContent(): Promise<AboutContent | undefined>;
  updateAboutContent(data: Partial<InsertAboutContent>): Promise<AboutContent>;
  
  getAboutValues(): Promise<AboutValue[]>;
  createAboutValue(value: InsertAboutValue): Promise<AboutValue>;
  updateAboutValue(id: string, value: Partial<InsertAboutValue>): Promise<AboutValue | undefined>;
  deleteAboutValue(id: string): Promise<boolean>;
  
  getServicesContent(): Promise<ServicesContent | undefined>;
  updateServicesContent(data: Partial<InsertServicesContent>): Promise<ServicesContent>;
  
  getServiceItems(): Promise<ServiceItem[]>;
  createServiceItem(item: InsertServiceItem): Promise<ServiceItem>;
  updateServiceItem(id: string, item: Partial<InsertServiceItem>): Promise<ServiceItem | undefined>;
  deleteServiceItem(id: string): Promise<boolean>;
  
  getSolutionsContent(): Promise<SolutionsContent | undefined>;
  updateSolutionsContent(data: Partial<InsertSolutionsContent>): Promise<SolutionsContent>;
  
  getSolutionItems(): Promise<SolutionItem[]>;
  createSolutionItem(item: InsertSolutionItem): Promise<SolutionItem>;
  updateSolutionItem(id: string, item: Partial<InsertSolutionItem>): Promise<SolutionItem | undefined>;
  deleteSolutionItem(id: string): Promise<boolean>;
  
  // Popup Forms
  getPopupForms(): Promise<PopupForm[]>;
  getPopupForm(id: string): Promise<PopupForm | undefined>;
  getActivePopupForm(): Promise<PopupForm | undefined>;
  createPopupForm(form: InsertPopupForm): Promise<PopupForm>;
  updatePopupForm(id: string, form: Partial<InsertPopupForm>): Promise<PopupForm | undefined>;
  deletePopupForm(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private articles: Map<string, Article>;
  private teamMembers: Map<string, TeamMember>;
  private pricingPackages: Map<string, PricingPackage>;
  private projectDiscussion: ProjectDiscussion | null;
  private bookingRequests: Map<string, BookingRequest>;
  private socialMediaAnalytics: Map<string, SocialMediaAnalytics>;
  private socialMediaIntegrations: Map<string, SocialMediaIntegration>;
  private oneTimePricingRequests: Map<string, OneTimePricingRequest>;
  private settings: SiteSettings;
  private visitorStats: VisitorStats;
  private todayDate: string;
  private resetCodes: Map<string, { code: string; expiresAt: number }>;
  private heroContent: HeroContent | null;
  private aboutContent: AboutContent | null;
  private aboutValues: Map<string, AboutValue>;
  private servicesContent: ServicesContent | null;
  private serviceItems: Map<string, ServiceItem>;
  private solutionsContent: SolutionsContent | null;
  private solutionItems: Map<string, SolutionItem>;
  private popupForms: Map<string, PopupForm>;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.teamMembers = new Map();
    this.pricingPackages = new Map();
    this.projectDiscussion = null;
    this.bookingRequests = new Map();
    this.socialMediaAnalytics = new Map();
    this.socialMediaIntegrations = new Map();
    this.oneTimePricingRequests = new Map();
    this.resetCodes = new Map();
    this.todayDate = new Date().toDateString();
    
    // Initialize home page content
    this.heroContent = null;
    this.aboutContent = null;
    this.aboutValues = new Map();
    this.servicesContent = null;
    this.serviceItems = new Map();
    this.solutionsContent = null;
    this.solutionItems = new Map();
    this.popupForms = new Map();
    
    // Initialize default home page content
    this.initializeHomePageDefaults();
    
    // Initialize admin user from environment variables
    // Initialize admin user from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminUsername || !adminPassword || !adminEmail) {
      throw new Error("ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL environment variables are required");
    }
    
    // Hash password synchronously using bcryptjs (for initialization only)
    const hashedPassword = bcryptjs.hashSync(adminPassword, 10);
    
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
    });
    
    // Test user removed for security - use admin account or create via admin panel if needed
    if (process.env.NODE_ENV !== "production" && process.env.CREATE_TEST_USER === "true") {
      const testPassword = bcryptjs.hashSync("test123", 10);
      const testUserId = randomUUID();
      this.users.set(testUserId, {
        id: testUserId,
        username: "testuser",
        password: testPassword,
        email: "test@example.com",
      });
      console.log("⚠️ Test user 'testuser' created (CREATE_TEST_USER=true)");
    }
    
    this.settings = {
      companyName: "VyomAi Cloud Pvt. Ltd",
      tagline: "Pioneering AI Solutions from Nepal",
      email: "info@vyomai.cloud",
      address: "Tokha, Kathmandu, Nepal",
      phone: "",
      aboutText: "VyomAi Cloud Pvt. Ltd is a startup company dedicated to AI technology research and development.",
      missionText: "To democratize AI technology and make it accessible for businesses of all sizes.",
      paymentEnabled: false,
      comingSoonEnabled: true,
      comingSoonTitle: "Coming Soon!",
      comingSoonMessage: "We are coming soon to share Knowledge and grow together. Stay tuned for exciting updates!",
      socialLinks: {
        linkedin: "#",
        instagram: "#",
        facebook: "#",
        whatsapp: "#",
        viber: "#",
        youtube: "#",
      },
      showHomeSection: true,
      showAboutSection: true,
      showServicesSection: true,
      showSolutionsSection: true,
      showMediaSection: true,
      showContactSection: true,
      showTeamSection: true,
      showPricingSection: true,
      showProjectDiscussionSection: true,
      bookingBotEnabled: true,
      publishFooter: true,
      defaultCurrency: "USD",
      welcomePopupEnabled: false,
      welcomePopupTitle: "Welcome",
      welcomePopupMessage: "Welcome to our site",
      welcomePopupButtonText: "Get Started",
      welcomePopupImageUrl: "",
      welcomePopupAnimationStyle: "fade",
      welcomePopupDismissable: true,
      emailProvider: "smtp",
      emailFromName: "VyomAi",
      emailFromAddress: "info@vyomai.cloud",
      smtpPort: "587",
      smtpSecure: false,
      emailProviderPriority: "smtp,gmail,sendgrid",
      socialMediaEnabled: {
        linkedin: true,
        instagram: true,
        facebook: true,
        whatsapp: true,
        viber: true,
        youtube: true
      },
      exchangeRates: { USD: 1, EUR: 0.92, INR: 83.12, NPR: 132.5 },
    };
    
    this.visitorStats = {
      totalVisitors: 1247,
      todayVisitors: 42,
      hourlyData: [
        { hour: "00:00", visitors: 8 },
        { hour: "04:00", visitors: 5 },
        { hour: "08:00", visitors: 18 },
        { hour: "12:00", visitors: 34 },
        { hour: "16:00", visitors: 42 },
        { hour: "20:00", visitors: 28 },
        { hour: "23:59", visitors: 12 },
      ],
      trafficSources: [
        { name: "Direct", value: 35 },
        { name: "Search", value: 28 },
        { name: "Social", value: 22 },
        { name: "Referral", value: 15 },
      ],
      deviceTypes: [
        { name: "Desktop", value: 612 },
        { name: "Mobile", value: 485 },
        { name: "Tablet", value: 150 },
      ],
      engagementMetrics: [
        { metric: "Avg. Session Time", value: 3 },
        { metric: "Bounce Rate", value: 35 },
        { metric: "Pages/Session", value: 2.4 },
        { metric: "Chat Engagement", value: 18 },
      ],
      topPages: [
        { page: "Home", views: 847 },
        { page: "About", views: 423 },
        { page: "Services", views: 392 },
        { page: "Contact", views: 285 },
        { page: "Solutions", views: 178 },
      ],
      socialMediaStats: [
        { platform: "LinkedIn", likes: 245, shares: 89, comments: 156, impressions: 3400 },
        { platform: "Instagram", likes: 892, shares: 234, comments: 567, impressions: 12500 },
        { platform: "Facebook", likes: 1203, shares: 389, comments: 743, impressions: 18900 },
        { platform: "YouTube", likes: 567, shares: 123, comments: 289, impressions: 8900 },
        { platform: "WhatsApp", likes: 0, shares: 345, comments: 0, impressions: 2300 },
        { platform: "Viber", likes: 0, shares: 123, comments: 0, impressions: 890 },
      ],
    };
    
    const sampleArticles: Article[] = [
      {
        id: randomUUID(),
        title: "Getting Started with AI Agents for Your Business",
        content: "Artificial Intelligence agents are transforming how businesses operate. In this article, we explore how AI agents can automate repetitive tasks, provide intelligent insights, and enhance customer experiences. VyomAi specializes in creating custom AI solutions that integrate seamlessly with your existing workflows.",
        type: "article",
        thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        mediaUrl: "",
        published: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        title: "Microsoft 365 Integration Demo",
        content: "Watch how VyomAi's intelligent agents integrate with Microsoft 365 to automate email responses, schedule meetings, and analyze documents. Our solutions work within your existing Microsoft ecosystem.",
        type: "video",
        thumbnailUrl: "https://images.unsplash.com/photo-1633419461186-7d40a239337d?w=800&q=80",
        mediaUrl: "https://www.youtube.com/embed/ScSz2V22hQQ",
        published: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: randomUUID(),
        title: "AI-Powered Analytics: A Quick Overview",
        content: "Learn how AI-powered analytics can transform raw data into actionable insights. This video tutorial covers the basics of implementing intelligent analytics in your organization.",
        type: "video",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        mediaUrl: "https://www.youtube.com/embed/H71mC-Fv8Fk",
        published: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
    
    sampleArticles.forEach(article => {
      this.articles.set(article.id, article);
    });

    // Initialize sample pricing packages
    const samplePricingPackages: PricingPackage[] = [
      {
        id: randomUUID(),
        name: "Starter",
        price: 499,
        description: "Perfect for small businesses",
        features: ["Basic AI Agent", "Email Integration", "5 Templates", "Email Support"],
        highlighted: false,
        enabled: true,
        contactMessage: "Get Started",
        floatingCloudEnabled: false,
        baseCurrency: "USD",
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        name: "Professional",
        price: 999,
        description: "For growing teams",
        features: ["Advanced AI Agent", "Multi-Platform Integration", "20 Templates", "Priority Support", "Analytics Dashboard"],
        highlighted: true,
        enabled: true,
        contactMessage: "Get Started",
        floatingCloudEnabled: false,
        baseCurrency: "USD",
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        name: "Enterprise",
        price: 2499,
        description: "For large organizations",
        features: ["Custom AI Agent", "Full Integration", "Unlimited Templates", "24/7 Support", "Advanced Analytics", "Dedicated Account Manager"],
        highlighted: false,
        enabled: true,
        contactMessage: "Contact Sales",
        floatingCloudEnabled: true,
        baseCurrency: "USD",
        createdAt: new Date().toISOString(),
      },
    ];

    samplePricingPackages.forEach(pkg => {
      this.pricingPackages.set(pkg.id, pkg);
    });

    // Initialize project discussion
    this.projectDiscussion = {
      id: randomUUID(),
      title: "Ready to Start Your AI Journey?",
      description: "Let's discuss your project and find the perfect AI solution for your business needs.",
      contactEmail: "info@vyomai.cloud",
      createdAt: new Date().toISOString(),
    };

    // Initialize social media analytics for all platforms
    const platforms = ["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"] as const;
    platforms.forEach(platform => {
      this.socialMediaAnalytics.set(platform, {
        id: randomUUID(),
        platform,
        engagementRate: Math.floor(Math.random() * 50) + 5,
        followersCount: Math.floor(Math.random() * 50000) + 1000,
        postsCount: Math.floor(Math.random() * 200) + 10,
        impressions: Math.floor(Math.random() * 500000) + 10000,
        likes: Math.floor(Math.random() * 1000) + 10,
        shares: Math.floor(Math.random() * 500) + 5,
        comments: Math.floor(Math.random() * 200) + 2,
        createdAt: new Date().toISOString(),
      });

      this.socialMediaIntegrations.set(platform, {
        id: randomUUID(),
        platform,
        isConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "admin",
      permissions: insertUser.permissions || "[]",
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, password: hashedPassword };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async storeResetCode(email: string, code: string): Promise<void> {
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
    this.resetCodes.set(email, { code, expiresAt });
    
    // Auto-delete after 15 minutes
    setTimeout(() => {
      this.resetCodes.delete(email);
    }, 15 * 60 * 1000);
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const stored = this.resetCodes.get(email);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.resetCodes.delete(email);
      return false;
    }
    return stored.code === code;
  }

  async resetPasswordByEmail(email: string, hashedPassword: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.username === "admin");
    if (!user) return false;
    
    const updated: User = { ...user, password: hashedPassword };
    this.users.set(user.id, updated);
    this.resetCodes.delete(email);
    return true;
  }

  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newArticle: Article = {
      ...article,
      id,
      createdAt: now,
      createdBy: article.createdBy || "System",
      updatedAt: now,
      updatedBy: article.createdBy || "System",
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = this.articles.get(id);
    if (!existing) return undefined;
    
    const updated: Article = { ...existing, ...article };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  async getSettings(): Promise<SiteSettings> {
    return this.settings;
  }

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.settings = { ...this.settings, ...settings };
    return this.settings;
  }

  async getVisitorStats(): Promise<VisitorStats> {
    const today = new Date().toDateString();
    if (today !== this.todayDate) {
      this.todayDate = today;
      this.visitorStats.todayVisitors = 0;
    }
    return this.visitorStats;
  }

  async incrementVisitors(): Promise<VisitorStats> {
    const today = new Date().toDateString();
    if (today !== this.todayDate) {
      this.todayDate = today;
      this.visitorStats.todayVisitors = 0;
    }
    this.visitorStats.totalVisitors++;
    this.visitorStats.todayVisitors++;
    return this.visitorStats;
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const newMember: TeamMember = {
      ...member,
      id,
      createdAt: new Date().toISOString(),
    };
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const existing = this.teamMembers.get(id);
    if (!existing) return undefined;
    
    const updated: TeamMember = { ...existing, ...member };
    this.teamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  async getPricingPackages(): Promise<PricingPackage[]> {
    const items = Array.from(this.pricingPackages.values());
    return items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }

  async getPricingPackage(id: string): Promise<PricingPackage | undefined> {
    return this.pricingPackages.get(id);
  }

  async createPricingPackage(pkg: InsertPricingPackage): Promise<PricingPackage> {
    const id = randomUUID();
    const newPackage: PricingPackage = {
      ...pkg,
      id,
      createdAt: new Date().toISOString(),
    };
    this.pricingPackages.set(id, newPackage);
    return newPackage;
  }

  async updatePricingPackage(id: string, pkg: Partial<InsertPricingPackage>): Promise<PricingPackage | undefined> {
    const existing = this.pricingPackages.get(id);
    if (!existing) return undefined;
    
    const updated: PricingPackage = { ...existing, ...pkg };
    this.pricingPackages.set(id, updated);
    return updated;
  }

  async deletePricingPackage(id: string): Promise<boolean> {
    return this.pricingPackages.delete(id);
  }

  async getProjectDiscussion(): Promise<ProjectDiscussion | undefined> {
    return this.projectDiscussion || undefined;
  }

  async updateProjectDiscussion(data: InsertProjectDiscussion): Promise<ProjectDiscussion> {
    if (!this.projectDiscussion) {
      this.projectDiscussion = {
        id: randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      };
    } else {
      this.projectDiscussion = { ...this.projectDiscussion, ...data };
    }
    return this.projectDiscussion;
  }

  async getBookingRequests(): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values()).sort((a, b) => 
      new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    );
  }

  async createBookingRequest(booking: InsertBookingRequest): Promise<BookingRequest> {
    const id = randomUUID();
    const newBooking: BookingRequest = {
      id,
      ...booking,
      createdAt: new Date().toISOString(),
    };
    this.bookingRequests.set(id, newBooking);
    return newBooking;
  }

  async deleteBookingRequest(id: string): Promise<boolean> {
    return this.bookingRequests.delete(id);
  }

  async updateBookingRequest(id: string, booking: Partial<InsertBookingRequest>): Promise<BookingRequest | undefined> {
    const existing = this.bookingRequests.get(id);
    if (!existing) return undefined;
    
    const updated: BookingRequest = { ...existing, ...booking };
    this.bookingRequests.set(id, updated);
    return updated;
  }

  async resetBookingRequests(): Promise<void> {
    this.bookingRequests.clear();
  }

  async getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]> {
    return Array.from(this.socialMediaAnalytics.values());
  }

  async getSocialMediaAnalytic(platform: string): Promise<SocialMediaAnalytics | undefined> {
    return this.socialMediaAnalytics.get(platform);
  }

  async updateSocialMediaAnalytics(platform: string, data: Partial<InsertSocialMediaAnalytics>): Promise<SocialMediaAnalytics> {
    const existing = this.socialMediaAnalytics.get(platform);
    if (!existing) {
      const newAnalytic: SocialMediaAnalytics = {
        id: randomUUID(),
        platform: platform as any,
        ...data,
        likes: data.likes ?? 0,
        shares: data.shares ?? 0,
        comments: data.comments ?? 0,
        impressions: data.impressions ?? 0,
        engagementRate: data.engagementRate ?? 0,
        followersCount: data.followersCount ?? 0,
        postsCount: data.postsCount ?? 0,
        createdAt: new Date().toISOString(),
      };
      this.socialMediaAnalytics.set(platform, newAnalytic);
      return newAnalytic;
    }

    const updated: SocialMediaAnalytics = { ...existing, ...data };
    this.socialMediaAnalytics.set(platform, updated);
    return updated;
  }

  async resetSocialMediaAnalytics(): Promise<void> {
    const platforms = ["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"] as const;
    platforms.forEach(platform => {
      this.socialMediaAnalytics.set(platform, {
        id: randomUUID(),
        platform,
        engagementRate: 0,
        followersCount: 0,
        postsCount: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        impressions: 0,
        createdAt: new Date().toISOString(),
      });
    });
  }

  async createOneTimePricingRequest(request: InsertOneTimePricingRequest): Promise<OneTimePricingRequest> {
    const id = randomUUID();
    const newRequest: OneTimePricingRequest = {
      id,
      ...request,
      createdAt: new Date().toISOString(),
    };
    this.oneTimePricingRequests.set(id, newRequest);
    return newRequest;
  }

  async getOneTimePricingRequests(): Promise<OneTimePricingRequest[]> {
    return Array.from(this.oneTimePricingRequests.values());
  }

  async updateOneTimePricingRequest(id: string, request: Partial<InsertOneTimePricingRequest>): Promise<OneTimePricingRequest | undefined> {
    const existing = this.oneTimePricingRequests.get(id);
    if (!existing) return undefined;
    
    const updated: OneTimePricingRequest = { ...existing, ...request };
    this.oneTimePricingRequests.set(id, updated);
    return updated;
  }

  async deleteOneTimePricingRequest(id: string): Promise<boolean> {
    return this.oneTimePricingRequests.delete(id);
  }

  async getSocialMediaIntegrations(): Promise<SocialMediaIntegration[]> {
    return Array.from(this.socialMediaIntegrations.values());
  }

  async getSocialMediaIntegration(platform: string): Promise<SocialMediaIntegration | undefined> {
    return this.socialMediaIntegrations.get(platform);
  }

  async updateSocialMediaIntegration(platform: string, data: Partial<InsertSocialMediaIntegration>): Promise<SocialMediaIntegration> {
    const existing = this.socialMediaIntegrations.get(platform);
    if (!existing) {
      const newIntegration: SocialMediaIntegration = {
        id: randomUUID(),
        platform: platform as any,
        isConnected: false,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.socialMediaIntegrations.set(platform, newIntegration);
      return newIntegration;
    }
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.socialMediaIntegrations.set(platform, updated);
    return updated;
  }

  async resetHourlyData(): Promise<VisitorStats> {
    this.visitorStats.hourlyData = [
      { hour: "00:00", visitors: 0 },
      { hour: "04:00", visitors: 0 },
      { hour: "08:00", visitors: 0 },
      { hour: "12:00", visitors: 0 },
      { hour: "16:00", visitors: 0 },
      { hour: "20:00", visitors: 0 },
      { hour: "23:59", visitors: 0 },
    ];
    return this.visitorStats;
  }

  async resetTrafficSources(): Promise<VisitorStats> {
    this.visitorStats.trafficSources = [
      { name: "Direct", value: 0 },
      { name: "Search", value: 0 },
      { name: "Social", value: 0 },
      { name: "Referral", value: 0 },
    ];
    return this.visitorStats;
  }

  async resetDeviceTypes(): Promise<VisitorStats> {
    this.visitorStats.deviceTypes = [
      { name: "Desktop", value: 0 },
      { name: "Mobile", value: 0 },
      { name: "Tablet", value: 0 },
    ];
    return this.visitorStats;
  }

  async resetTopPages(): Promise<VisitorStats> {
    this.visitorStats.topPages = [
      { page: "Home", views: 0 },
      { page: "About", views: 0 },
      { page: "Services", views: 0 },
      { page: "Contact", views: 0 },
      { page: "Solutions", views: 0 },
    ];
    return this.visitorStats;
  }

  async resetEngagementMetrics(): Promise<VisitorStats> {
    this.visitorStats.engagementMetrics = [
      { metric: "Avg. Session Time", value: 0 },
      { metric: "Bounce Rate", value: 0 },
      { metric: "Pages/Session", value: 0 },
      { metric: "Chat Engagement", value: 0 },
    ];
    return this.visitorStats;
  }

  async resetSocialMediaStats(): Promise<VisitorStats> {
    this.visitorStats.socialMediaStats = [
      { platform: "LinkedIn", likes: 0, shares: 0, comments: 0, impressions: 0 },
      { platform: "Instagram", likes: 0, shares: 0, comments: 0, impressions: 0 },
      { platform: "Facebook", likes: 0, shares: 0, comments: 0, impressions: 0 },
      { platform: "YouTube", likes: 0, shares: 0, comments: 0, impressions: 0 },
      { platform: "WhatsApp", likes: 0, shares: 0, comments: 0, impressions: 0 },
      { platform: "Viber", likes: 0, shares: 0, comments: 0, impressions: 0 },
    ];
    return this.visitorStats;
  }

  async resetTotalVisitors(): Promise<VisitorStats> {
    this.visitorStats.totalVisitors = 0;
    this.visitorStats.todayVisitors = 0;
    return this.visitorStats;
  }

  // Initialize default home page content
  private initializeHomePageDefaults(): void {
    // Hero Section defaults
    this.heroContent = {
      id: randomUUID(),
      badgeText: "Pioneering AI Solutions from Nepal",
      titleLine1: "Transform Your",
      titleLine2: "Business with AI",
      subtitle: "We build intelligent AI agents and seamlessly integrate with Google, Microsoft, and enterprise platforms. Share knowledge, empower your team, and grow together.",
      primaryButtonText: "Get Started",
      primaryButtonLink: "#contact",
      secondaryButtonText: "Watch Demo",
      secondaryButtonLink: "#media",
      backgroundStyle: "particles",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    // About Section defaults
    this.aboutContent = {
      id: randomUUID(),
      badgeText: "About VyomAi",
      titleHighlight: "Pioneering AI",
      titleNormal: " in Nepal",
      description: "VyomAi Pvt Ltd is a startup company dedicated to AI technology research and development. Based in Tokha, Kathmandu, Nepal, we work tirelessly to provide the best AI product solutions and consulting services for organizations seeking to embrace the future.",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    // Default About Values
    const defaultAboutValues = [
      { icon: "Target", title: "Our Mission", description: "To democratize AI technology and make it accessible for businesses of all sizes, from startups to enterprises.", order: 0 },
      { icon: "Users", title: "Knowledge Sharing", description: "We believe in sharing knowledge. If you learn from us, share it with others for the betterment of everyone.", order: 1 },
      { icon: "Lightbulb", title: "Innovation", description: "Constantly researching and developing cutting-edge AI solutions that solve real-world problems.", order: 2 },
      { icon: "Heart", title: "Nepal to Global", description: "Rooted in traditional Nepali values, we bring our expertise to organizations worldwide.", order: 3 },
    ];
    defaultAboutValues.forEach(v => {
      const id = randomUUID();
      this.aboutValues.set(id, { ...v, id, enabled: true, createdAt: new Date().toISOString() });
    });

    // Services Section defaults
    this.servicesContent = {
      id: randomUUID(),
      badgeText: "Our Services",
      titleNormal: "What We ",
      titleHighlight: "Offer",
      description: "Comprehensive AI solutions designed to transform how your organization works, from automation to intelligent analytics.",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    // Default Service Items
    const defaultServiceItems = [
      { icon: "Bot", title: "AI Agent Templates", description: "Ready-to-deploy AI agents customized for your business needs. Automate tasks and enhance productivity.", order: 0 },
      { icon: "Brain", title: "Custom AI Bots", description: "Intelligent chatbots and virtual assistants tailored to your specific requirements and workflows.", order: 1 },
      { icon: "Cloud", title: "Platform Integration", description: "Seamless integration with Google Workspace, Microsoft 365, and enterprise cloud platforms.", order: 2 },
      { icon: "BarChart3", title: "AI Analytics", description: "Data-driven insights with intelligent AI that provides expert analytical reports for your business.", order: 3 },
      { icon: "Cog", title: "AI Consultation", description: "Expert guidance on AI strategy, implementation, and best practices for your organization.", order: 4 },
      { icon: "Shield", title: "Secure Solutions", description: "Enterprise-grade security ensuring your data and AI systems are protected at all times.", order: 5 },
    ];
    defaultServiceItems.forEach(s => {
      const id = randomUUID();
      this.serviceItems.set(id, { ...s, id, enabled: true, createdAt: new Date().toISOString() });
    });

    // Solutions Section defaults
    this.solutionsContent = {
      id: randomUUID(),
      badgeText: "AI Solutions",
      titleHighlight: "Enterprise",
      titleNormal: " Integrations",
      description: "Connect AI capabilities with the platforms you already use. Transform your workflows without disrupting your team.",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    // Default Solution Items
    const defaultSolutionItems = [
      { 
        icon: "SiGoogle", 
        title: "Google Workspace Integration", 
        description: "Connect your AI agents with Gmail, Google Calendar, Drive, and more. Automate workflows and enhance team collaboration.",
        features: ["Smart email categorization and responses", "Calendar management and scheduling", "Document analysis and summarization", "Team productivity insights"],
        gradientFrom: "blue-500/20",
        gradientTo: "green-500/20",
        order: 0 
      },
      { 
        icon: "Building2", 
        title: "Microsoft 365 Integration", 
        description: "Seamlessly integrate with Outlook, Teams, SharePoint, and the entire Microsoft ecosystem for enterprise AI.",
        features: ["Outlook email automation", "Teams bot integration", "SharePoint document processing", "Power Platform connectivity"],
        gradientFrom: "orange-500/20",
        gradientTo: "blue-500/20",
        order: 1 
      },
    ];
    defaultSolutionItems.forEach(sol => {
      const id = randomUUID();
      this.solutionItems.set(id, { ...sol, id, enabled: true, createdAt: new Date().toISOString() });
    });
  }

  // Hero Content Methods
  async getHeroContent(): Promise<HeroContent | undefined> {
    return this.heroContent || undefined;
  }

  async updateHeroContent(data: Partial<InsertHeroContent>): Promise<HeroContent> {
    if (!this.heroContent) {
      this.heroContent = {
        id: randomUUID(),
        badgeText: data.badgeText || "Pioneering AI Solutions from Nepal",
        titleLine1: data.titleLine1 || "Transform Your",
        titleLine2: data.titleLine2 || "Business with AI",
        subtitle: data.subtitle || "",
        primaryButtonText: data.primaryButtonText || "Get Started",
        primaryButtonLink: data.primaryButtonLink || "#contact",
        secondaryButtonText: data.secondaryButtonText || "Watch Demo",
        secondaryButtonLink: data.secondaryButtonLink || "#media",
        backgroundStyle: data.backgroundStyle || "particles",
        enabled: data.enabled ?? true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.heroContent = { ...this.heroContent, ...data, updatedAt: new Date().toISOString() };
    }
    return this.heroContent;
  }

  // About Content Methods
  async getAboutContent(): Promise<AboutContent | undefined> {
    return this.aboutContent || undefined;
  }

  async updateAboutContent(data: Partial<InsertAboutContent>): Promise<AboutContent> {
    if (!this.aboutContent) {
      this.aboutContent = {
        id: randomUUID(),
        badgeText: data.badgeText || "About VyomAi",
        titleHighlight: data.titleHighlight || "Pioneering AI",
        titleNormal: data.titleNormal || " in Nepal",
        description: data.description || "",
        enabled: data.enabled ?? true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.aboutContent = { ...this.aboutContent, ...data, updatedAt: new Date().toISOString() };
    }
    return this.aboutContent;
  }

  // About Values Methods
  async getAboutValues(): Promise<AboutValue[]> {
    return Array.from(this.aboutValues.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async createAboutValue(value: InsertAboutValue): Promise<AboutValue> {
    const id = randomUUID();
    const newValue: AboutValue = { ...value, id, createdAt: new Date().toISOString() };
    this.aboutValues.set(id, newValue);
    return newValue;
  }

  async updateAboutValue(id: string, value: Partial<InsertAboutValue>): Promise<AboutValue | undefined> {
    const existing = this.aboutValues.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...value };
    this.aboutValues.set(id, updated);
    return updated;
  }

  async deleteAboutValue(id: string): Promise<boolean> {
    return this.aboutValues.delete(id);
  }

  // Services Content Methods
  async getServicesContent(): Promise<ServicesContent | undefined> {
    return this.servicesContent || undefined;
  }

  async updateServicesContent(data: Partial<InsertServicesContent>): Promise<ServicesContent> {
    if (!this.servicesContent) {
      this.servicesContent = {
        id: randomUUID(),
        badgeText: data.badgeText || "Our Services",
        titleNormal: data.titleNormal || "What We ",
        titleHighlight: data.titleHighlight || "Offer",
        description: data.description || "",
        enabled: data.enabled ?? true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.servicesContent = { ...this.servicesContent, ...data, updatedAt: new Date().toISOString() };
    }
    return this.servicesContent;
  }

  // Service Items Methods
  async getServiceItems(): Promise<ServiceItem[]> {
    return Array.from(this.serviceItems.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const id = randomUUID();
    const newItem: ServiceItem = { ...item, id, createdAt: new Date().toISOString() };
    this.serviceItems.set(id, newItem);
    return newItem;
  }

  async updateServiceItem(id: string, item: Partial<InsertServiceItem>): Promise<ServiceItem | undefined> {
    const existing = this.serviceItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.serviceItems.set(id, updated);
    return updated;
  }

  async deleteServiceItem(id: string): Promise<boolean> {
    return this.serviceItems.delete(id);
  }

  // Solutions Content Methods
  async getSolutionsContent(): Promise<SolutionsContent | undefined> {
    return this.solutionsContent || undefined;
  }

  async updateSolutionsContent(data: Partial<InsertSolutionsContent>): Promise<SolutionsContent> {
    if (!this.solutionsContent) {
      this.solutionsContent = {
        id: randomUUID(),
        badgeText: data.badgeText || "AI Solutions",
        titleHighlight: data.titleHighlight || "Enterprise",
        titleNormal: data.titleNormal || " Integrations",
        description: data.description || "",
        enabled: data.enabled ?? true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.solutionsContent = { ...this.solutionsContent, ...data, updatedAt: new Date().toISOString() };
    }
    return this.solutionsContent;
  }

  // Solution Items Methods
  async getSolutionItems(): Promise<SolutionItem[]> {
    return Array.from(this.solutionItems.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async createSolutionItem(item: InsertSolutionItem): Promise<SolutionItem> {
    const id = randomUUID();
    const newItem: SolutionItem = { ...item, id, createdAt: new Date().toISOString() };
    this.solutionItems.set(id, newItem);
    return newItem;
  }

  async updateSolutionItem(id: string, item: Partial<InsertSolutionItem>): Promise<SolutionItem | undefined> {
    const existing = this.solutionItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.solutionItems.set(id, updated);
    return updated;
  }

  async deleteSolutionItem(id: string): Promise<boolean> {
    return this.solutionItems.delete(id);
  }

  // Popup Forms Methods
  async getPopupForms(): Promise<PopupForm[]> {
    return Array.from(this.popupForms.values());
  }

  async getPopupForm(id: string): Promise<PopupForm | undefined> {
    return this.popupForms.get(id);
  }

  async getActivePopupForm(): Promise<PopupForm | undefined> {
    return Array.from(this.popupForms.values()).find(form => form.enabled);
  }

  async createPopupForm(form: InsertPopupForm): Promise<PopupForm> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newForm: PopupForm = { ...form, id, createdAt: now, updatedAt: now };
    this.popupForms.set(id, newForm);
    return newForm;
  }

  async updatePopupForm(id: string, form: Partial<InsertPopupForm>): Promise<PopupForm | undefined> {
    const existing = this.popupForms.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...form, updatedAt: new Date().toISOString() };
    this.popupForms.set(id, updated);
    return updated;
  }

  async deletePopupForm(id: string): Promise<boolean> {
    return this.popupForms.delete(id);
  }
}

if (isDatabaseAvailable) {
  storage = new DatabaseStorage();
} else {
  storage = new MemStorage();
}

export { storage };
export { DatabaseStorage };
