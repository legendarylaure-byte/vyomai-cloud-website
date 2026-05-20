import { firestore, admin } from "./firebase.js";
import { randomUUID } from "crypto";
import bcryptjs from "bcryptjs";
import type {
  User, InsertUser, Article, InsertArticle, SiteSettings, VisitorStats,
  TeamMember, InsertTeamMember, PricingPackage, InsertPricingPackage,
  ProjectDiscussion, InsertProjectDiscussion, BookingRequest, InsertBookingRequest,
  SocialMediaAnalytics, InsertSocialMediaAnalytics,
  SocialMediaIntegration, InsertSocialMediaIntegration,
  OneTimePricingRequest, InsertOneTimePricingRequest,
  CustomerInquiry, InsertCustomerInquiry, PopupForm, InsertPopupForm,
  HeroContent, InsertHeroContent, AboutContent, InsertAboutContent,
  AboutValue, InsertAboutValue, ServicesContent, InsertServicesContent,
  ServiceItem, InsertServiceItem, SolutionsContent, InsertSolutionsContent,
  SolutionItem, InsertSolutionItem,
} from "../shared/schema.js";

function getFirestore() {
  if (!firestore) throw new Error("Firestore not initialized (firebase is null)");
  return firestore;
}

function doc(id: string = "default") {
  return getFirestore().collection("settings").doc(id);
}

function col(name: string) {
  return getFirestore().collection(name);
}

export class FirebaseStorage {
  private resetCodes = new Map<string, { code: string; expiresAt: number }>();
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeDefaults().catch(err => {
      console.error("Firebase init error:", err);
      throw err;
    });
  }

  async waitForInit() {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase init timed out after 30s")), 30000)
    );
    await Promise.race([this.initPromise, timeout]);
  }

  private async initializeDefaults() {
    await this.ensureAdminUser();
    await this.ensureSettings();
    await this.ensureVisitorStats();
    await this.ensureProjectDiscussion();
    await this.seedArticles();
    await this.seedPricing();
    await this.seedSocialMedia();
    await this.seedHomeContent();
  }

  private async ensureAdminUser() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminUsername || !adminPassword || !adminEmail) {
      throw new Error("ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL required");
    }
    const snap = await col("users").where("username", "==", adminUsername).limit(1).get();
    if (snap.empty) {
      const hashed = bcryptjs.hashSync(adminPassword, 12);
      await col("users").doc(randomUUID()).set({
        id: randomUUID(),
        username: adminUsername,
        password: hashed,
        email: adminEmail,
        role: "vyom_admin",
        permissions: "[]",
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async ensureSettings() {
    const snap = await col("site_settings").doc("default").get();
    if (!snap.exists) {
      await col("site_settings").doc("default").set({
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
        comingSoonMessage: "We are coming soon to share Knowledge and grow together.",
        socialLinks: { linkedin: "#", instagram: "#", facebook: "#", whatsapp: "#", viber: "#", youtube: "#" },
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
        aiGreetingEnabled: false,
        aiGreetingText: "",
        emailProvider: "smtp",
        emailFromName: "VyomAi",
        emailFromAddress: "info@vyomai.cloud",
        smtpHost: "smtp.zoho.com",
        smtpPort: "587",
        smtpUser: "info@vyomai.cloud",
        smtpSecure: false,
        emailProviderPriority: "smtp,gmail,sendgrid",
        socialMediaEnabled: { linkedin: true, instagram: true, facebook: true, whatsapp: true, viber: true, youtube: true },
        exchangeRates: { USD: 1, EUR: 0.92, INR: 83.12, NPR: 132.5 },
      });
    }
  }

  private async ensureVisitorStats() {
    const snap = await col("visitor_stats").doc("default").get();
    if (!snap.exists) {
      await col("visitor_stats").doc("default").set({
        totalVisitors: 1247,
        todayVisitors: 42,
        hourlyData: [{ hour: "00:00", visitors: 8 }, { hour: "04:00", visitors: 5 }, { hour: "08:00", visitors: 18 }, { hour: "12:00", visitors: 34 }, { hour: "16:00", visitors: 42 }, { hour: "20:00", visitors: 28 }, { hour: "23:59", visitors: 12 }],
        trafficSources: [{ name: "Direct", value: 35 }, { name: "Search", value: 28 }, { name: "Social", value: 22 }, { name: "Referral", value: 15 }],
        deviceTypes: [{ name: "Desktop", value: 612 }, { name: "Mobile", value: 485 }, { name: "Tablet", value: 150 }],
        engagementMetrics: [{ metric: "Avg. Session Time", value: 3 }, { metric: "Bounce Rate", value: 35 }, { metric: "Pages/Session", value: 2.4 }, { metric: "Chat Engagement", value: 18 }],
        topPages: [{ page: "Home", views: 847 }, { page: "About", views: 423 }, { page: "Services", views: 392 }, { page: "Contact", views: 285 }, { page: "Solutions", views: 178 }],
        socialMediaStats: [
          { platform: "LinkedIn", likes: 245, shares: 89, comments: 156, impressions: 3400 },
          { platform: "Instagram", likes: 892, shares: 234, comments: 567, impressions: 12500 },
          { platform: "Facebook", likes: 1203, shares: 389, comments: 743, impressions: 18900 },
          { platform: "YouTube", likes: 567, shares: 123, comments: 289, impressions: 8900 },
          { platform: "WhatsApp", likes: 0, shares: 345, comments: 0, impressions: 2300 },
          { platform: "Viber", likes: 0, shares: 123, comments: 0, impressions: 890 },
        ],
      });
    }
  }

  private async ensureProjectDiscussion() {
    const snap = await col("project_discussion").doc("default").get();
    if (!snap.exists) {
      await col("project_discussion").doc("default").set({
        id: randomUUID(),
        title: "Ready to Start Your AI Journey?",
        description: "Let's discuss your project and find the perfect AI solution for your business needs.",
        contactEmail: "info@vyomai.cloud",
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async seedArticles() {
    const snap = await col("articles").limit(1).get();
    if (!snap.empty) return;
    const articles = [
      { title: "Getting Started with AI Agents for Your Business", content: "Artificial Intelligence agents are transforming how businesses operate.", type: "article", thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", mediaUrl: "", published: true },
      { title: "Microsoft 365 Integration Demo", content: "Watch how VyomAi's intelligent agents integrate with Microsoft 365.", type: "video", thumbnailUrl: "https://images.unsplash.com/photo-1633419461186-7d40a239337d?w=800&q=80", mediaUrl: "https://www.youtube.com/embed/ScSz2V22hQQ", published: true },
      { title: "AI-Powered Analytics: A Quick Overview", content: "Learn how AI-powered analytics can transform raw data into actionable insights.", type: "video", thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", mediaUrl: "https://www.youtube.com/embed/H71mC-Fv8Fk", published: true },
    ];
    for (const a of articles) {
      await col("articles").doc(randomUUID()).set({ id: randomUUID(), ...a, createdAt: new Date().toISOString() });
    }
  }

  private async seedPricing() {
    const snap = await col("pricing_packages").limit(1).get();
    if (!snap.empty) return;
    const packages = [
      { name: "Starter", price: 499, description: "Perfect for small businesses", features: ["Basic AI Agent", "Email Integration", "5 Templates", "Email Support"], highlighted: false, enabled: true, contactMessage: "Get Started", floatingCloudEnabled: false, baseCurrency: "USD" },
      { name: "Professional", price: 999, description: "For growing teams", features: ["Advanced AI Agent", "Multi-Platform Integration", "20 Templates", "Priority Support", "Analytics Dashboard"], highlighted: true, enabled: true, contactMessage: "Get Started", floatingCloudEnabled: false, baseCurrency: "USD" },
      { name: "Enterprise", price: 2499, description: "For large organizations", features: ["Custom AI Agent", "Full Integration", "Unlimited Templates", "24/7 Support", "Advanced Analytics", "Dedicated Account Manager"], highlighted: false, enabled: true, contactMessage: "Contact Sales", floatingCloudEnabled: true, baseCurrency: "USD" },
    ];
    for (const p of packages) {
      await col("pricing_packages").doc(randomUUID()).set({ id: randomUUID(), ...p, createdAt: new Date().toISOString() });
    }
  }

  private async seedSocialMedia() {
    const snap = await col("social_media_analytics").limit(1).get();
    if (!snap.empty) return;
    const platforms = ["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"];
    for (const platform of platforms) {
      await col("social_media_analytics").doc(platform).set({
        id: randomUUID(), platform,
        engagementRate: Math.floor(Math.random() * 50) + 5,
        followersCount: Math.floor(Math.random() * 50000) + 1000,
        postsCount: Math.floor(Math.random() * 200) + 10,
        impressions: Math.floor(Math.random() * 500000) + 10000,
        likes: Math.floor(Math.random() * 1000) + 10,
        shares: Math.floor(Math.random() * 500) + 5,
        comments: Math.floor(Math.random() * 200) + 2,
        createdAt: new Date().toISOString(),
      });
      await col("social_media_integrations").doc(platform).set({
        id: randomUUID(), platform, isConnected: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }
  }

  private async seedHomeContent() {
    const snap = await col("hero_content").doc("default").get();
    if (snap.exists) return;

    await col("hero_content").doc("default").set({
      id: randomUUID(), badgeText: "Pioneering AI Solutions from Nepal",
      titleLine1: "Transform Your", titleLine2: "Business with AI",
      subtitle: "We build intelligent AI agents and seamlessly integrate with Google, Microsoft, and enterprise platforms.",
      primaryButtonText: "Get Started", primaryButtonLink: "#contact",
      secondaryButtonText: "Watch Demo", secondaryButtonLink: "#media",
      backgroundStyle: "particles", enabled: true, updatedAt: new Date().toISOString(),
    });

    await col("about_content").doc("default").set({
      id: randomUUID(), badgeText: "About VyomAi",
      titleHighlight: "Pioneering AI", titleNormal: " in Nepal",
      description: "VyomAi Pvt Ltd is a startup company dedicated to AI technology research and development.",
      enabled: true, updatedAt: new Date().toISOString(),
    });

    const values = [
      { icon: "Target", title: "Our Mission", description: "To democratize AI technology and make it accessible for businesses of all sizes.", order: 0 },
      { icon: "Users", title: "Knowledge Sharing", description: "We believe in sharing knowledge.", order: 1 },
      { icon: "Lightbulb", title: "Innovation", description: "Constantly researching and developing cutting-edge AI solutions.", order: 2 },
      { icon: "Heart", title: "Nepal to Global", description: "Rooted in traditional Nepali values.", order: 3 },
    ];
    for (const v of values) {
      await col("about_values").doc(randomUUID()).set({ id: randomUUID(), ...v, enabled: true, createdAt: new Date().toISOString() });
    }

    await col("services_content").doc("default").set({
      id: randomUUID(), badgeText: "Our Services",
      titleNormal: "What We ", titleHighlight: "Offer",
      description: "Comprehensive AI solutions designed to transform how your organization works.",
      enabled: true, updatedAt: new Date().toISOString(),
    });

    const services = [
      { icon: "Bot", title: "AI Agent Templates", description: "Ready-to-deploy AI agents customized for your business needs.", order: 0 },
      { icon: "Brain", title: "Custom AI Bots", description: "Intelligent chatbots and virtual assistants tailored to your specific requirements.", order: 1 },
      { icon: "Cloud", title: "Platform Integration", description: "Seamless integration with Google Workspace, Microsoft 365.", order: 2 },
      { icon: "BarChart3", title: "AI Analytics", description: "Data-driven insights with intelligent AI.", order: 3 },
      { icon: "Cog", title: "AI Consultation", description: "Expert guidance on AI strategy.", order: 4 },
      { icon: "Shield", title: "Secure Solutions", description: "Enterprise-grade security.", order: 5 },
    ];
    for (const s of services) {
      await col("service_items").doc(randomUUID()).set({ id: randomUUID(), ...s, enabled: true, createdAt: new Date().toISOString() });
    }

    await col("solutions_content").doc("default").set({
      id: randomUUID(), badgeText: "AI Solutions",
      titleHighlight: "Enterprise", titleNormal: " Integrations",
      description: "Connect AI capabilities with the platforms you already use.",
      enabled: true, updatedAt: new Date().toISOString(),
    });

    const solutions = [
      { icon: "SiGoogle", title: "Google Workspace Integration", description: "Connect your AI agents with Gmail, Google Calendar, Drive, and more.", features: ["Smart email categorization", "Calendar management", "Document analysis", "Team productivity insights"], gradientFrom: "blue-500/20", gradientTo: "green-500/20", order: 0 },
      { icon: "Building2", title: "Microsoft 365 Integration", description: "Seamlessly integrate with Outlook, Teams, SharePoint.", features: ["Outlook email automation", "Teams bot integration", "SharePoint document processing", "Power Platform connectivity"], gradientFrom: "orange-500/20", gradientTo: "blue-500/20", order: 1 },
    ];
    for (const sol of solutions) {
      await col("solution_items").doc(randomUUID()).set({ id: randomUUID(), ...sol, enabled: true, createdAt: new Date().toISOString() });
    }
  }

  // ---- Users ----
  async getUser(id: string) {
    const snap = await col("users").doc(id).get();
    return snap.exists ? (snap.data() as User) : undefined;
  }
  async getUserByUsername(username: string) {
    const snap = await col("users").where("username", "==", username).limit(1).get();
    return snap.empty ? undefined : (snap.docs[0].data() as User);
  }
  async getUserByEmail(email: string) {
    const snap = await col("users").where("email", "==", email).limit(1).get();
    return snap.empty ? undefined : (snap.docs[0].data() as User);
  }
  async getAllUsers() {
    const snap = await col("users").get();
    return snap.docs.map(d => {
      const data = d.data() as User;
      return { ...data, password: "[REDACTED]" } as User;
    });
  }
  async createUser(data: InsertUser) {
    const { password, ...safe } = data;
    const user: User = { ...data, id: randomUUID(), role: data.role || "admin", permissions: data.permissions || "[]", createdAt: new Date().toISOString() } as User;
    await col("users").doc(user.id).set(user);
    return { ...user, password: "[REDACTED]" } as User;
  }
  async updateUser(id: string, data: Partial<InsertUser>) {
    const docRef = col("users").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as User;
  }
  async updateUserPassword(id: string, hashedPassword: string) {
    const docRef = col("users").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update({ password: hashedPassword });
    return (await docRef.get()).data() as User;
  }
  async deleteUser(id: string) {
    await col("users").doc(id).delete();
    return true;
  }

  async storeResetCode(email: string, code: string) {
    this.resetCodes.set(email, { code, expiresAt: Date.now() + 15 * 60 * 1000 });
    setTimeout(() => this.resetCodes.delete(email), 15 * 60 * 1000);
  }
  async verifyResetCode(email: string, code: string) {
    const stored = this.resetCodes.get(email);
    if (!stored || Date.now() > stored.expiresAt) {
      this.resetCodes.delete(email);
      return false;
    }
    return stored.code === code;
  }

  // ---- Articles ----
  async getArticles() {
    const snap = await col("articles").orderBy("createdAt", "desc").get();
    return snap.docs.map(d => d.data() as Article);
  }
  async getArticle(id: string) {
    const snap = await col("articles").doc(id).get();
    return snap.exists ? (snap.data() as Article) : undefined;
  }
  async createArticle(data: InsertArticle) {
    const now = new Date().toISOString();
    const article: Article = { ...data, id: randomUUID(), createdAt: now, createdBy: data.createdBy || "System", updatedAt: now, updatedBy: data.createdBy || "System" } as Article;
    await col("articles").doc(article.id).set(article);
    return article;
  }
  async updateArticle(id: string, data: Partial<InsertArticle>) {
    const docRef = col("articles").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as Article;
  }
  async deleteArticle(id: string) {
    await col("articles").doc(id).delete();
    return true;
  }

  // ---- Team ----
  async getTeamMembers() {
    const snap = await col("team_members").orderBy("createdAt", "desc").get();
    return snap.docs.map(d => d.data() as TeamMember);
  }
  async getTeamMember(id: string) {
    const snap = await col("team_members").doc(id).get();
    return snap.exists ? (snap.data() as TeamMember) : undefined;
  }
  async createTeamMember(data: InsertTeamMember) {
    const member: TeamMember = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as TeamMember;
    await col("team_members").doc(member.id).set(member);
    return member;
  }
  async updateTeamMember(id: string, data: Partial<InsertTeamMember>) {
    const docRef = col("team_members").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as TeamMember;
  }
  async deleteTeamMember(id: string) {
    await col("team_members").doc(id).delete();
    return true;
  }

  // ---- Pricing ----
  async getPricingPackages() {
    const snap = await col("pricing_packages").get();
    return snap.docs.map(d => d.data() as PricingPackage).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  async getPricingPackage(id: string) {
    const snap = await col("pricing_packages").doc(id).get();
    return snap.exists ? (snap.data() as PricingPackage) : undefined;
  }
  async createPricingPackage(data: InsertPricingPackage) {
    const pkg: PricingPackage = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as PricingPackage;
    await col("pricing_packages").doc(pkg.id).set(pkg);
    return pkg;
  }
  async updatePricingPackage(id: string, data: Partial<InsertPricingPackage>) {
    const docRef = col("pricing_packages").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as PricingPackage;
  }
  async deletePricingPackage(id: string) {
    await col("pricing_packages").doc(id).delete();
    return true;
  }

  // ---- Project Discussion ----
  async getProjectDiscussion() {
    const snap = await col("project_discussion").doc("default").get();
    return snap.exists ? (snap.data() as ProjectDiscussion) : undefined;
  }
  async updateProjectDiscussion(data: InsertProjectDiscussion) {
    const snap = await col("project_discussion").doc("default").get();
    if (!snap.exists) {
      const doc = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
      await col("project_discussion").doc("default").set(doc);
      return doc as ProjectDiscussion;
    }
    await col("project_discussion").doc("default").update(data as any);
    return (await col("project_discussion").doc("default").get()).data() as ProjectDiscussion;
  }

  // ---- Settings ----
  async getSettings() {
    const snap = await col("site_settings").doc("default").get();
    return (snap.data() || {}) as SiteSettings;
  }
  async updateSettings(data: Partial<SiteSettings>) {
    await col("site_settings").doc("default").set(data, { merge: true });
    return (await col("site_settings").doc("default").get()).data() as SiteSettings;
  }

  // ---- Visitor Stats ----
  async getVisitorStats() {
    const snap = await col("visitor_stats").doc("default").get();
    return (snap.data() || {}) as VisitorStats;
  }
  async incrementVisitors() {
    const docRef = col("visitor_stats").doc("default");
    await docRef.set({
      totalVisitors: admin.firestore.FieldValue.increment(1),
      todayVisitors: admin.firestore.FieldValue.increment(1),
    } as any, { merge: true });
    return (await docRef.get()).data() as VisitorStats;
  }
  async resetHourlyData() {
    await col("visitor_stats").doc("default").update({ hourlyData: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetTrafficSources() {
    await col("visitor_stats").doc("default").update({ trafficSources: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetDeviceTypes() {
    await col("visitor_stats").doc("default").update({ deviceTypes: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetTopPages() {
    await col("visitor_stats").doc("default").update({ topPages: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetEngagementMetrics() {
    await col("visitor_stats").doc("default").update({ engagementMetrics: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetSocialMediaStats() {
    await col("visitor_stats").doc("default").update({ socialMediaStats: [] });
    return (await col("visitor_stats").doc("default").get()).data() as VisitorStats;
  }
  async resetTotalVisitors() {
    const docRef = col("visitor_stats").doc("default");
    await docRef.update({ totalVisitors: 0, todayVisitors: 0 });
    return (await docRef.get()).data() as VisitorStats;
  }

  // ---- Bookings ----
  async getBookingRequests() {
    const snap = await col("booking_requests").orderBy("createdAt", "desc").get();
    return snap.docs.map(d => d.data() as BookingRequest);
  }
  async createBookingRequest(data: InsertBookingRequest) {
    const booking: BookingRequest = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as BookingRequest;
    await col("booking_requests").doc(booking.id).set(booking);
    return booking;
  }
  async updateBookingRequest(id: string, data: Partial<InsertBookingRequest>) {
    const docRef = col("booking_requests").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as BookingRequest;
  }
  async deleteBookingRequest(id: string) {
    await col("booking_requests").doc(id).delete();
    return true;
  }
  async resetBookingRequests() {
    const snap = await col("booking_requests").get();
    await Promise.all(snap.docs.map(d => d.ref.delete()));
  }

  // ---- Social Media Analytics ----
  async getSocialMediaAnalytics() {
    const snap = await col("social_media_analytics").get();
    return snap.docs.map(d => d.data() as SocialMediaAnalytics);
  }
  async getSocialMediaAnalytic(platform: string) {
    const snap = await col("social_media_analytics").doc(platform).get();
    return snap.exists ? (snap.data() as SocialMediaAnalytics) : undefined;
  }
  async updateSocialMediaAnalytics(platform: string, data: Partial<InsertSocialMediaAnalytics>) {
    const docRef = col("social_media_analytics").doc(platform);
    const snap = await docRef.get();
    if (!snap.exists) {
      const doc = { id: randomUUID(), platform: platform as any, ...data, likes: data.likes ?? 0, shares: data.shares ?? 0, comments: data.comments ?? 0, impressions: data.impressions ?? 0, engagementRate: data.engagementRate ?? 0, followersCount: data.followersCount ?? 0, postsCount: data.postsCount ?? 0, createdAt: new Date().toISOString() } as SocialMediaAnalytics;
      await docRef.set(doc);
      return doc;
    }
    await docRef.update(data as any);
    return (await docRef.get()).data() as SocialMediaAnalytics;
  }
  async resetSocialMediaAnalytics() {
    const platforms = ["linkedin", "instagram", "facebook", "whatsapp", "viber", "youtube"];
    for (const p of platforms) {
      await col("social_media_analytics").doc(p).set({
        id: randomUUID(), platform: p, engagementRate: 0, followersCount: 0, postsCount: 0, likes: 0, shares: 0, comments: 0, impressions: 0, createdAt: new Date().toISOString(),
      });
    }
  }

  // ---- Social Media Integrations ----
  async getSocialMediaIntegrations() {
    const snap = await col("social_media_integrations").get();
    return snap.docs.map(d => d.data() as SocialMediaIntegration);
  }
  async getSocialMediaIntegration(platform: string) {
    const snap = await col("social_media_integrations").doc(platform).get();
    return snap.exists ? (snap.data() as SocialMediaIntegration) : undefined;
  }
  async updateSocialMediaIntegration(platform: string, data: Partial<InsertSocialMediaIntegration>) {
    const docRef = col("social_media_integrations").doc(platform);
    const snap = await docRef.get();
    if (!snap.exists) {
      const doc = { id: randomUUID(), platform: platform as any, isConnected: false, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SocialMediaIntegration;
      await docRef.set(doc);
      return doc;
    }
    await docRef.update({ ...data, updatedAt: new Date().toISOString() } as any);
    return (await docRef.get()).data() as SocialMediaIntegration;
  }

  // ---- One-Time Pricing Requests ----
  async getOneTimePricingRequests() {
    const snap = await col("one_time_pricing_requests").get();
    return snap.docs.map(d => d.data() as OneTimePricingRequest);
  }
  async createOneTimePricingRequest(data: InsertOneTimePricingRequest) {
    const doc: OneTimePricingRequest = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as OneTimePricingRequest;
    await col("one_time_pricing_requests").doc(doc.id).set(doc);
    return doc;
  }
  async updateOneTimePricingRequest(id: string, data: Partial<InsertOneTimePricingRequest>) {
    const docRef = col("one_time_pricing_requests").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as OneTimePricingRequest;
  }
  async deleteOneTimePricingRequest(id: string) {
    await col("one_time_pricing_requests").doc(id).delete();
    return true;
  }

  // ---- Customer Inquiries ----
  async getCustomerInquiries() {
    const snap = await col("customer_inquiries").orderBy("createdAt", "desc").get();
    return snap.docs.map(d => d.data() as CustomerInquiry);
  }
  async createCustomerInquiry(data: InsertCustomerInquiry) {
    const doc: CustomerInquiry = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as CustomerInquiry;
    await col("customer_inquiries").doc(doc.id).set(doc);
    return doc;
  }
  async updateCustomerInquiry(id: string, data: Partial<InsertCustomerInquiry>) {
    const docRef = col("customer_inquiries").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as CustomerInquiry;
  }
  async deleteCustomerInquiry(id: string) {
    await col("customer_inquiries").doc(id).delete();
    return true;
  }

  // ---- Popup Forms ----
  async getPopupForms() {
    const snap = await col("popup_forms").get();
    return snap.docs.map(d => d.data() as PopupForm);
  }
  async getPopupForm(id: string) {
    const snap = await col("popup_forms").doc(id).get();
    return snap.exists ? (snap.data() as PopupForm) : undefined;
  }
  async getActivePopupForm() {
    const snap = await col("popup_forms").where("enabled", "==", true).limit(1).get();
    return snap.empty ? undefined : (snap.docs[0].data() as PopupForm);
  }
  async createPopupForm(data: InsertPopupForm) {
    const now = new Date().toISOString();
    const doc: PopupForm = { ...data, id: randomUUID(), createdAt: now, updatedAt: now } as PopupForm;
    await col("popup_forms").doc(doc.id).set(doc);
    return doc;
  }
  async updatePopupForm(id: string, data: Partial<InsertPopupForm>) {
    const docRef = col("popup_forms").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update({ ...data, updatedAt: new Date().toISOString() } as any);
    return (await docRef.get()).data() as PopupForm;
  }
  async deletePopupForm(id: string) {
    await col("popup_forms").doc(id).delete();
    return true;
  }

  // ---- Hero Content ----
  async getHeroContent() {
    const snap = await col("hero_content").doc("default").get();
    return snap.exists ? (snap.data() as HeroContent) : undefined;
  }
  async updateHeroContent(data: Partial<InsertHeroContent>) {
    await col("hero_content").doc("default").set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return (await col("hero_content").doc("default").get()).data() as HeroContent;
  }

  // ---- About Content ----
  async getAboutContent() {
    const snap = await col("about_content").doc("default").get();
    return snap.exists ? (snap.data() as AboutContent) : undefined;
  }
  async updateAboutContent(data: Partial<InsertAboutContent>) {
    await col("about_content").doc("default").set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return (await col("about_content").doc("default").get()).data() as AboutContent;
  }

  // ---- About Values ----
  async getAboutValues() {
    const snap = await col("about_values").orderBy("order", "asc").get();
    return snap.docs.map(d => d.data() as AboutValue);
  }
  async createAboutValue(data: InsertAboutValue) {
    const doc: AboutValue = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as AboutValue;
    await col("about_values").doc(doc.id).set(doc);
    return doc;
  }
  async updateAboutValue(id: string, data: Partial<InsertAboutValue>) {
    const docRef = col("about_values").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as AboutValue;
  }
  async deleteAboutValue(id: string) {
    await col("about_values").doc(id).delete();
    return true;
  }

  // ---- Services Content ----
  async getServicesContent() {
    const snap = await col("services_content").doc("default").get();
    return snap.exists ? (snap.data() as ServicesContent) : undefined;
  }
  async updateServicesContent(data: Partial<InsertServicesContent>) {
    await col("services_content").doc("default").set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return (await col("services_content").doc("default").get()).data() as ServicesContent;
  }

  // ---- Service Items ----
  async getServiceItems() {
    const snap = await col("service_items").orderBy("order", "asc").get();
    return snap.docs.map(d => d.data() as ServiceItem);
  }
  async createServiceItem(data: InsertServiceItem) {
    const doc: ServiceItem = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as ServiceItem;
    await col("service_items").doc(doc.id).set(doc);
    return doc;
  }
  async updateServiceItem(id: string, data: Partial<InsertServiceItem>) {
    const docRef = col("service_items").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as ServiceItem;
  }
  async deleteServiceItem(id: string) {
    await col("service_items").doc(id).delete();
    return true;
  }

  // ---- Solutions Content ----
  async getSolutionsContent() {
    const snap = await col("solutions_content").doc("default").get();
    return snap.exists ? (snap.data() as SolutionsContent) : undefined;
  }
  async updateSolutionsContent(data: Partial<InsertSolutionsContent>) {
    await col("solutions_content").doc("default").set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return (await col("solutions_content").doc("default").get()).data() as SolutionsContent;
  }

  // ---- Solution Items ----
  async getSolutionItems() {
    const snap = await col("solution_items").orderBy("order", "asc").get();
    return snap.docs.map(d => d.data() as SolutionItem);
  }
  async createSolutionItem(data: InsertSolutionItem) {
    const doc: SolutionItem = { ...data, id: randomUUID(), createdAt: new Date().toISOString() } as SolutionItem;
    await col("solution_items").doc(doc.id).set(doc);
    return doc;
  }
  async updateSolutionItem(id: string, data: Partial<InsertSolutionItem>) {
    const docRef = col("solution_items").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return undefined;
    await docRef.update(data as any);
    return (await docRef.get()).data() as SolutionItem;
  }
  async deleteSolutionItem(id: string) {
    await col("solution_items").doc(id).delete();
    return true;
  }

  // ---- Social Media Sync Logs / API Configs (stubs for interface compat) ----
  async getSocialMediaSyncLogs(_platform?: string, _limit?: number) { return []; }
  async createSocialMediaSyncLog(_log: any) { return {}; }
  async getSocialMediaApiConfigs() { return []; }
  async getSocialMediaApiConfig(_platform: string) { return undefined; }
  async updateSocialMediaApiConfig(_platform: string, _config: any) { return {}; }
  async deleteSocialMediaApiConfig(_platform: string) { return true; }
}
