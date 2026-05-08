import { db } from "./db.js";
import {
  usersTable, articlesTable, teamMembersTable, pricingPackagesTable,
  projectDiscussionTable, bookingRequestsTable, siteSettingsTable,
  visitorStatsTable, socialMediaAnalyticsTable, socialMediaIntegrationsTable,
  oneTimePricingRequestsTable, customerInquiriesTable, popupFormsTable,
  heroContentTable, aboutContentTable, aboutValuesTable, servicesContentTable,
  serviceItemsTable, solutionsContentTable, solutionItemsTable,
  socialMediaSyncLogsTable, socialMediaApiConfigTable
} from "../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import {
  type User, type InsertUser, type Article, type InsertArticle, type SiteSettings, type VisitorStats, type TeamMember, type InsertTeamMember, type PricingPackage, type InsertPricingPackage, type ProjectDiscussion, type InsertProjectDiscussion, type BookingRequest, type InsertBookingRequest, type SocialMediaAnalytics, type InsertSocialMediaAnalytics, type SocialMediaIntegration, type InsertSocialMediaIntegration, type OneTimePricingRequest, type InsertOneTimePricingRequest, type CustomerInquiry, type InsertCustomerInquiry, type PopupForm, type InsertPopupForm,
  type HeroContent, type InsertHeroContent, type AboutContent, type InsertAboutContent, type AboutValue, type InsertAboutValue, type ServicesContent, type InsertServicesContent, type ServiceItem, type InsertServiceItem, type SolutionsContent, type InsertSolutionsContent, type SolutionItem, type InsertSolutionItem
} from "../shared/schema.js";
import { randomUUID } from "crypto";
import bcryptjs from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;

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

  getOneTimePricingRequests(): Promise<OneTimePricingRequest[]>;
  createOneTimePricingRequest(request: InsertOneTimePricingRequest): Promise<OneTimePricingRequest>;
  updateOneTimePricingRequest(id: string, request: Partial<InsertOneTimePricingRequest>): Promise<OneTimePricingRequest | undefined>;
  deleteOneTimePricingRequest(id: string): Promise<boolean>;

  getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]>;
  getSocialMediaAnalytic(platform: string): Promise<SocialMediaAnalytics | undefined>;
  updateSocialMediaAnalytics(platform: string, data: Partial<InsertSocialMediaAnalytics>): Promise<SocialMediaAnalytics>;
  resetSocialMediaAnalytics(): Promise<void>;

  getSocialMediaIntegrations(): Promise<SocialMediaIntegration[]>;
  getSocialMediaIntegration(platform: string): Promise<SocialMediaIntegration | undefined>;
  updateSocialMediaIntegration(platform: string, data: Partial<InsertSocialMediaIntegration>): Promise<SocialMediaIntegration>;

  getCustomerInquiries(): Promise<CustomerInquiry[]>;
  createCustomerInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry>;
  updateCustomerInquiry(id: string, inquiry: Partial<InsertCustomerInquiry>): Promise<CustomerInquiry | undefined>;
  deleteCustomerInquiry(id: string): Promise<boolean>;

  storeResetCode(email: string, code: string): Promise<void>;
  verifyResetCode(email: string, code: string): Promise<boolean>;

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

  // Social Media Auto-Sync Management
  getSocialMediaSyncLogs(platform?: string, limit?: number): Promise<any[]>;
  createSocialMediaSyncLog(log: any): Promise<any>;

  getSocialMediaApiConfigs(): Promise<any[]>;
  getSocialMediaApiConfig(platform: string): Promise<any | undefined>;
  updateSocialMediaApiConfig(platform: string, config: any): Promise<any>;
  deleteSocialMediaApiConfig(platform: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultUsers().catch(err => console.error("Failed to initialize users:", err));
    this.initializeDefaultUsers().catch(err => console.error("Failed to initialize users:", err));
    this.initializeDefaultSettings().catch(err => console.error("Failed to initialize settings:", err));
    this.ensureSchema().catch(err => console.error("Failed to ensure schema:", err));
  }

  private async ensureSchema(): Promise<void> {
    try {
        if (!db) return;
        // Auto-migration: Ensure smtp_password column exists
        await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_password TEXT;`);
        console.log("✅ Auto-migration: Checked/Added 'smtp_password' column to site_settings");
    } catch (error) {
        console.error("❌ Auto-migration failed:", error);
    }
  }

  private async initializeDefaultUsers(): Promise<void> {
    try {
      if (!db) return;
      // Initialize admin user
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const adminEmail = process.env.ADMIN_EMAIL || "shekhar@vyomai.cloud";

      const existingAdmin = await this.getUserByUsername(adminUsername);
      if (!existingAdmin) {
        const hashedPassword = bcryptjs.hashSync(adminPassword, 10);
        const adminId = randomUUID();
        await db.insert(usersTable).values({
          id: adminId,
          username: adminUsername,
          password: hashedPassword,
          email: adminEmail,
          role: "vyom_admin",
          permissions: "[]",
        });
        console.log("✅ Admin user initialized with vyom_admin role");
      } else if (!existingAdmin.role || existingAdmin.role !== "vyom_admin") {
        await db.update(usersTable)
          .set({ role: "vyom_admin" })
          .where(eq(usersTable.id, existingAdmin.id));
        console.log("✅ Admin user upgraded to vyom_admin role");
      }

      // Initialize test user for development
      const testUserExists = await this.getUserByEmail("aayu.phuyal@gmail.com");
      if (!testUserExists) {
        const testPassword = bcryptjs.hashSync("test123", 10);
        const testUserId = randomUUID();
        await db.insert(usersTable).values({
          id: testUserId,
          username: "aayuphuyal",
          password: testPassword,
          email: "aayu.phuyal@gmail.com",
          role: "vyom_admin",
          permissions: "[]",
        });
        console.log("✅ Test user initialized with vyom_admin role");
      } else if (!testUserExists.role || testUserExists.role !== "vyom_admin") {
        await db.update(usersTable)
          .set({ role: "vyom_admin" })
          .where(eq(usersTable.id, testUserExists.id));
        console.log("✅ Test user upgraded to vyom_admin role");
      }
    } catch (error) {
      console.error("Error initializing users:", error);
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    try {
      if (!db) return;
      const existingSettings = await db.select().from(siteSettingsTable).limit(1);
      if (existingSettings.length === 0) {
        const settingsId = randomUUID();
        await db.insert(siteSettingsTable).values({
          id: settingsId,
          companyName: "VyomAi Cloud Pvt. Ltd",
          tagline: "AI Solutions for Business & Personal Growth",
          email: "info@vyomai.cloud",
          address: "Tokha, Kathmandu, Nepal",
          phone: "+977-1-5900000",
          aboutText: "VyomAi is a Nepal-based AI technology startup providing intelligent business solutions.",
          missionText: "To democratize AI technology and make it accessible for businesses of all sizes.",
          socialLinks: JSON.stringify({
            linkedin: "https://linkedin.com/company/vyomai",
            instagram: "https://instagram.com/vyomai",
            facebook: "https://facebook.com/vyomai",
            whatsapp: "https://wa.me/977",
            viber: "https://viber.com/vyomai",
            youtube: "https://youtube.com/@vyomai",
          }),
          showHomeSection: true,
          showAboutSection: true,
          showServicesSection: true,
          showSolutionsSection: true,
          showTeamSection: true,
          showPricingSection: true,
          showMediaSection: true,
          showProjectDiscussionSection: true,
          showContactSection: true,
          bookingBotEnabled: true,
          exchangeRates: JSON.stringify({
            USD: 1,
            EUR: 0.92,
            INR: 83.12,
            NPR: 132.5,
          }),
          defaultCurrency: "NPR",
        });
        console.log("✅ Default site settings initialized");
      }
    } catch (error) {
      console.error("Error initializing settings:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const user = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return user[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const user = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    return user[0] as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return user[0] as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    try {
      const id = randomUUID();
      const user: any = { ...insertUser, id, password: insertUser.password };
      const result = await db.insert(usersTable).values(user).returning();

      if (!result || result.length === 0) {
        throw new Error("Database returned empty result for user creation");
      }

      const created = result[0] as unknown as User;
      return created;
    } catch (error) {
      console.error("❌ DB: User creation failed:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not initialized");
    const users = await db.select().from(usersTable);
    return users as unknown as User[];
  }

  async updateUser(id: string, data: Partial<any>): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    return result[0] as unknown as User | undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(usersTable).set({ password: hashedPassword }).where(eq(usersTable.id, id)).returning();
    return result[0] as unknown as User | undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(usersTable).where(eq(usersTable.id, id));
    return true;
  }

  async getArticles(): Promise<Article[]> {
    if (!db) throw new Error("Database not initialized");
    const articles = await db.select().from(articlesTable);
    return articles.map(a => ({
      ...a,
      createdAt: typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as Date).toISOString()
    })) as Article[];
  }

  async getArticle(id: string): Promise<Article | undefined> {
    if (!db) throw new Error("Database not initialized");
    const article = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
    if (!article[0]) return undefined;
    return {
      ...article[0],
      createdAt: typeof article[0].createdAt === 'string' ? article[0].createdAt : (article[0].createdAt as Date).toISOString()
    } as Article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(articlesTable).values({ id, ...article, createdAt: now }).returning();
    if (!result || result.length === 0) throw new Error("Article creation failed");
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as Article;
  }

  async updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(articlesTable).set(article).where(eq(articlesTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as Article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(articlesTable).where(eq(articlesTable.id, id));
    return true;
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    if (!db) throw new Error("Database not initialized");
    const members = await db.select().from(teamMembersTable);
    return members.map(m => ({
      ...m,
      createdAt: typeof m.createdAt === 'string' ? m.createdAt : (m.createdAt as Date).toISOString()
    })) as TeamMember[];
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    if (!db) throw new Error("Database not initialized");
    const member = await db.select().from(teamMembersTable).where(eq(teamMembersTable.id, id)).limit(1);
    if (!member[0]) return undefined;
    return {
      ...member[0],
      createdAt: typeof member[0].createdAt === 'string' ? member[0].createdAt : (member[0].createdAt as Date).toISOString()
    } as TeamMember;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(teamMembersTable).values({ id, ...member, createdAt: now }).returning();
    if (!result || result.length === 0) throw new Error("Team member creation failed");
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as TeamMember;
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(teamMembersTable).set(member).where(eq(teamMembersTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as TeamMember;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(teamMembersTable).where(eq(teamMembersTable.id, id));
    return true;
  }

  async getPricingPackages(): Promise<PricingPackage[]> {
    if (!db) throw new Error("Database not initialized");
    const packages = await db.select().from(pricingPackagesTable);
    return packages.map(pkg => {
      let features: string[] = [];
      if (typeof pkg.features === 'string') {
        try {
          features = JSON.parse(pkg.features);
        } catch {
          try {
            let unescaped = pkg.features;
            if (unescaped.startsWith('"') && unescaped.endsWith('"')) {
              unescaped = unescaped.slice(1, -1);
            }
            unescaped = unescaped.replace(/""/g, '"');
            features = JSON.parse(unescaped);
          } catch {
            features = [];
          }
        }
      } else if (Array.isArray(pkg.features)) {
        features = pkg.features;
      }

      return {
        ...pkg,
        features,
        price: typeof pkg.price === 'string' ? parseInt(pkg.price) : pkg.price,
        monthlyPrice: typeof pkg.monthlyPrice === 'string' ? parseInt(pkg.monthlyPrice) : pkg.monthlyPrice,
        yearlyPrice: typeof pkg.yearlyPrice === 'string' ? parseInt(pkg.yearlyPrice) : pkg.yearlyPrice,
        createdAt: typeof pkg.createdAt === 'string' ? pkg.createdAt : (pkg.createdAt as Date).toISOString()
      } as PricingPackage;
    });
  }

  async getPricingPackage(id: string): Promise<PricingPackage | undefined> {
    if (!db) throw new Error("Database not initialized");
    const pkg = await db.select().from(pricingPackagesTable).where(eq(pricingPackagesTable.id, id)).limit(1);
    if (!pkg[0]) return undefined;

    let features: string[] = [];
    if (typeof pkg[0].features === 'string') {
      try {
        features = JSON.parse(pkg[0].features);
      } catch {
        try {
          let unescaped = pkg[0].features;
          if (unescaped.startsWith('"') && unescaped.endsWith('"')) {
            unescaped = unescaped.slice(1, -1);
          }
          unescaped = unescaped.replace(/""/g, '"');
          features = JSON.parse(unescaped);
        } catch {
          features = [];
        }
      }
    } else if (Array.isArray(pkg[0].features)) {
      features = pkg[0].features;
    }

    return {
      ...pkg[0],
      features,
      price: typeof pkg[0].price === 'string' ? parseInt(pkg[0].price) : pkg[0].price,
      monthlyPrice: typeof pkg[0].monthlyPrice === 'string' ? parseInt(pkg[0].monthlyPrice) : pkg[0].monthlyPrice,
      yearlyPrice: typeof pkg[0].yearlyPrice === 'string' ? parseInt(pkg[0].yearlyPrice) : pkg[0].yearlyPrice,
      createdAt: typeof pkg[0].createdAt === 'string' ? pkg[0].createdAt : (pkg[0].createdAt as Date).toISOString()
    } as PricingPackage;
  }

  async createPricingPackage(pkg: InsertPricingPackage): Promise<PricingPackage> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(pricingPackagesTable).values({
      id,
      ...pkg,
      features: JSON.stringify(pkg.features),
      price: String(pkg.price),
      monthlyPrice: pkg.monthlyPrice ? String(pkg.monthlyPrice) : null,
      yearlyPrice: pkg.yearlyPrice ? String(pkg.yearlyPrice) : null,
      createdAt: now
    }).returning();

    if (!result || result.length === 0) throw new Error("Pricing package creation failed");

    const created = result[0];
    return {
      ...created,
      features: typeof created.features === 'string' ? JSON.parse(created.features) : created.features,
      price: typeof created.price === 'string' ? parseInt(created.price) : created.price,
      monthlyPrice: created.monthlyPrice ? parseInt(created.monthlyPrice) : undefined,
      yearlyPrice: created.yearlyPrice ? parseInt(created.yearlyPrice) : undefined,
      createdAt: typeof created.createdAt === 'string' ? created.createdAt : (created.createdAt as Date).toISOString()
    } as PricingPackage;
  }

  async updatePricingPackage(id: string, pkg: Partial<InsertPricingPackage>): Promise<PricingPackage | undefined> {
    if (!db) throw new Error("Database not initialized");
    const updateData: any = { ...pkg };
    if (pkg.features) {
      updateData.features = JSON.stringify(pkg.features);
    }
    if (pkg.price !== undefined) {
      updateData.price = String(pkg.price);
    }
    if (pkg.monthlyPrice !== undefined) {
      updateData.monthlyPrice = pkg.monthlyPrice ? String(pkg.monthlyPrice) : null;
    }
    if (pkg.yearlyPrice !== undefined) {
      updateData.yearlyPrice = pkg.yearlyPrice ? String(pkg.yearlyPrice) : null;
    }
    // Remove oneTimePrice from here if it's not in the insert schema, or add it to schema
    const result = await db.update(pricingPackagesTable).set(updateData).where(eq(pricingPackagesTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      features: typeof result[0].features === 'string' ? JSON.parse(result[0].features) : result[0].features,
      price: typeof result[0].price === 'string' ? parseInt(result[0].price) : result[0].price,
      monthlyPrice: result[0].monthlyPrice ? parseInt(result[0].monthlyPrice) : undefined,
      yearlyPrice: result[0].yearlyPrice ? parseInt(result[0].yearlyPrice) : undefined,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as PricingPackage;
  }

  async deletePricingPackage(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(pricingPackagesTable).where(eq(pricingPackagesTable.id, id));
    return true;
  }

  async getProjectDiscussion(): Promise<ProjectDiscussion | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(projectDiscussionTable).limit(1);
    if (!result[0]) return undefined;
    
    return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as ProjectDiscussion;
  }

  async updateProjectDiscussion(data: InsertProjectDiscussion): Promise<ProjectDiscussion> {
    if (!db) throw new Error("Database not initialized");
    const existing = await this.getProjectDiscussion();
    if (existing) {
      const result = await db.update(projectDiscussionTable).set(data).where(eq(projectDiscussionTable.id, existing.id)).returning();
      return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
      } as ProjectDiscussion;
    }
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(projectDiscussionTable).values({ id, ...data, createdAt: now }).returning();
    return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
      } as ProjectDiscussion;
  }

  async getBookingRequests(): Promise<BookingRequest[]> {
    if (!db) throw new Error("Database not initialized");
    const requests = await db.select().from(bookingRequestsTable);
    return requests.map(r => ({
        ...r,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt as Date).toISOString()
    })) as BookingRequest[];
  }

  async createBookingRequest(booking: InsertBookingRequest): Promise<BookingRequest> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(bookingRequestsTable).values({ id, ...booking, createdAt: now }).returning();
    return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as BookingRequest;
  }

  async updateBookingRequest(id: string, booking: Partial<InsertBookingRequest>): Promise<BookingRequest | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(bookingRequestsTable).set(booking).where(eq(bookingRequestsTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as BookingRequest;
  }

  async deleteBookingRequest(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(bookingRequestsTable).where(eq(bookingRequestsTable.id, id));
    return true;
  }

  async resetBookingRequests(): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(bookingRequestsTable);
  }

  async getOneTimePricingRequests(): Promise<OneTimePricingRequest[]> {
     if (!db) throw new Error("Database not initialized");
     const requests = await db.select().from(oneTimePricingRequestsTable);
     return requests.map(r => ({
           ...r,
           estimatedPrice: typeof r.estimatedPrice === 'string' ? parseInt(r.estimatedPrice) : r.estimatedPrice,
           createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt as Date).toISOString()
     })) as OneTimePricingRequest[];
  }

  async createOneTimePricingRequest(request: InsertOneTimePricingRequest): Promise<OneTimePricingRequest> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(oneTimePricingRequestsTable).values({
      id,
      ...request,
      estimatedPrice: String(request.estimatedPrice),
      createdAt: now
    }).returning();
    return {
      ...result[0],
      estimatedPrice: typeof result[0].estimatedPrice === 'string' ? parseInt(result[0].estimatedPrice) : result[0].estimatedPrice,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as OneTimePricingRequest;
  }

  async updateOneTimePricingRequest(id: string, request: Partial<InsertOneTimePricingRequest>): Promise<OneTimePricingRequest | undefined> {
    const updateData: any = { ...request };
    if (request.estimatedPrice !== undefined) {
      updateData.estimatedPrice = String(request.estimatedPrice);
    }
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(oneTimePricingRequestsTable).set(updateData).where(eq(oneTimePricingRequestsTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      estimatedPrice: typeof result[0].estimatedPrice === 'string' ? parseInt(result[0].estimatedPrice) : result[0].estimatedPrice,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as OneTimePricingRequest;
  }

  async deleteOneTimePricingRequest(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(oneTimePricingRequestsTable).where(eq(oneTimePricingRequestsTable.id, id));
    return true;
  }

  async getSettings(): Promise<SiteSettings> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(siteSettingsTable).limit(1);
    if (result[0]) {
      const settings = result[0];
      return {
        ...settings,
        socialLinks: typeof settings.socialLinks === 'string' ? JSON.parse(settings.socialLinks) : settings.socialLinks,
        exchangeRates: typeof settings.exchangeRates === 'string' ? JSON.parse(settings.exchangeRates) : settings.exchangeRates,
        socialMediaEnabled: {
          linkedin: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          viber: true,
          youtube: true
        }
      } as unknown as SiteSettings;
    }
    return {
      socialMediaEnabled: {
          linkedin: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          viber: true,
          youtube: true
      }
    } as SiteSettings;
  }

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const existing = await this.getSettings();

      const dataToSave: any = { ...settings };
      if (settings.socialLinks && typeof settings.socialLinks === 'object') {
        dataToSave.socialLinks = JSON.stringify(settings.socialLinks);
      }
      if (settings.exchangeRates && typeof settings.exchangeRates === 'object') {
        dataToSave.exchangeRates = JSON.stringify(settings.exchangeRates);
      }

      if (existing && (existing as any).id) {
        if (!db) throw new Error("Database not initialized");
        const result = await db.update(siteSettingsTable).set(dataToSave).where(eq(siteSettingsTable.id, (existing as any).id)).returning();
        if (!result[0]) {
          throw new Error("Update returned no results");
        }
        const updated = result[0];
        return {
          ...updated,
          socialLinks: typeof updated.socialLinks === 'string' ? JSON.parse(updated.socialLinks) : updated.socialLinks,
          exchangeRates: typeof updated.exchangeRates === 'string' ? JSON.parse(updated.exchangeRates) : updated.exchangeRates,
          socialMediaEnabled: {
            linkedin: true,
            instagram: true,
            facebook: true,
            whatsapp: true,
            viber: true,
            youtube: true
          }
        } as unknown as SiteSettings;
      }

      // Create new record with defaults for required fields
      const id = randomUUID();
      const newSettings = {
        id,
        companyName: settings.companyName || "VyomAi Cloud Pvt. Ltd",
        tagline: settings.tagline || "AI Solutions Platform",
        email: settings.email || "info@vyomai.cloud",
        address: settings.address || "Tokha, Kathmandu, Nepal",
        aboutText: settings.aboutText || "Welcome to VyomAi",
        missionText: settings.missionText || "Empowering businesses with AI",
        socialLinks: dataToSave.socialLinks || JSON.stringify({}),
        exchangeRates: dataToSave.exchangeRates || JSON.stringify({ USD: 1, EUR: 0.92, INR: 83.12, NPR: 132.5 }),
        ...dataToSave,
      };

      if (!db) throw new Error("Database not initialized");
      const result = await db.insert(siteSettingsTable).values(newSettings).returning();
      if (!result[0]) {
        throw new Error("Insert returned no results");
      }
      const created = result[0];
      return {
        ...created,
        socialLinks: typeof created.socialLinks === 'string' ? JSON.parse(created.socialLinks) : created.socialLinks,
        exchangeRates: typeof created.exchangeRates === 'string' ? JSON.parse(created.exchangeRates) : created.exchangeRates,
        socialMediaEnabled: {
            linkedin: true,
            instagram: true,
            facebook: true,
            whatsapp: true,
            viber: true,
            youtube: true
        }
      } as SiteSettings;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("DB: updateSettings error:", error);
      }
      throw error;
    }
  }

  async getVisitorStats(): Promise<VisitorStats> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(visitorStatsTable).limit(1);
    if (result[0]) {
      const stats = result[0];
      return {
        totalVisitors: typeof stats.totalVisitors === 'string' ? parseInt(stats.totalVisitors) : stats.totalVisitors,
        todayVisitors: typeof stats.todayVisitors === 'string' ? parseInt(stats.todayVisitors) : stats.todayVisitors,
        hourlyData: stats.hourlyData ? JSON.parse(stats.hourlyData) : [],
        trafficSources: stats.trafficSources ? JSON.parse(stats.trafficSources) : [],
        deviceTypes: stats.deviceTypes ? JSON.parse(stats.deviceTypes) : [],
        engagementMetrics: stats.engagementMetrics ? JSON.parse(stats.engagementMetrics) : [],
        topPages: stats.topPages ? JSON.parse(stats.topPages) : [],
        socialMediaStats: stats.socialMediaStats ? JSON.parse(stats.socialMediaStats) : [],
      } as VisitorStats;
    }
    return {} as VisitorStats;
  }

  async updateVisitorStats(data: Partial<VisitorStats>): Promise<VisitorStats> {
    try {
      if (!db) throw new Error("Database not initialized");
      const existing = await db.select().from(visitorStatsTable).limit(1);
      const updateData: any = {};

      if (data.totalVisitors !== undefined) updateData.totalVisitors = String(data.totalVisitors);
      if (data.todayVisitors !== undefined) updateData.todayVisitors = String(data.todayVisitors);
      if (data.hourlyData !== undefined) updateData.hourlyData = JSON.stringify(data.hourlyData);
      if (data.trafficSources !== undefined) updateData.trafficSources = JSON.stringify(data.trafficSources);
      if (data.deviceTypes !== undefined) updateData.deviceTypes = JSON.stringify(data.deviceTypes);
      if (data.engagementMetrics !== undefined) updateData.engagementMetrics = JSON.stringify(data.engagementMetrics);
      if (data.topPages !== undefined) updateData.topPages = JSON.stringify(data.topPages);
      if (data.socialMediaStats !== undefined) updateData.socialMediaStats = JSON.stringify(data.socialMediaStats);

      if (existing.length > 0 && existing[0].id) {
        await db.update(visitorStatsTable).set(updateData).where(eq(visitorStatsTable.id, existing[0].id));
      } else {
        const id = randomUUID();
        await db.insert(visitorStatsTable).values({
          id,
          totalVisitors: updateData.totalVisitors || "0",
          todayVisitors: updateData.todayVisitors || "0",
          hourlyData: updateData.hourlyData || "[]",
          trafficSources: updateData.trafficSources || "[]",
          deviceTypes: updateData.deviceTypes || "[]",
          engagementMetrics: updateData.engagementMetrics || "[]",
          topPages: updateData.topPages || "[]",
          socialMediaStats: updateData.socialMediaStats || "[]",
        });
      }
      return this.getVisitorStats();
    } catch (error) {
      console.error("DB: updateVisitorStats error:", error);
      throw error;
    }
  }

  async incrementVisitors(): Promise<VisitorStats> {
    const stats = await this.getVisitorStats();
    return this.updateVisitorStats({
      totalVisitors: (stats.totalVisitors || 0) + 1,
      todayVisitors: (stats.todayVisitors || 0) + 1,
    });
  }

  async resetHourlyData(): Promise<VisitorStats> {
    return this.updateVisitorStats({ hourlyData: [] });
  }

  async resetTrafficSources(): Promise<VisitorStats> {
    return this.updateVisitorStats({ trafficSources: [] });
  }

  async resetDeviceTypes(): Promise<VisitorStats> {
    return this.updateVisitorStats({ deviceTypes: [] });
  }

  async resetTopPages(): Promise<VisitorStats> {
    return this.updateVisitorStats({ topPages: [] });
  }

  async resetEngagementMetrics(): Promise<VisitorStats> {
    return this.updateVisitorStats({ engagementMetrics: [] });
  }

  async resetSocialMediaStats(): Promise<VisitorStats> {
    return this.updateVisitorStats({ socialMediaStats: [] });
  }

  async resetTotalVisitors(): Promise<VisitorStats> {
    return this.updateVisitorStats({ totalVisitors: 0, todayVisitors: 0 });
  }


  async resetSocialMediaAnalytics(): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(socialMediaAnalyticsTable);
  }

  async getSocialMediaIntegrations(): Promise<SocialMediaIntegration[]> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(socialMediaIntegrationsTable);
      return result.map(r => ({
          ...r,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt as Date).toISOString(),
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : (r.updatedAt as Date).toISOString()
      })) as SocialMediaIntegration[];
  }

  async getSocialMediaIntegration(platform: string): Promise<SocialMediaIntegration | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(socialMediaIntegrationsTable).where(eq(socialMediaIntegrationsTable.platform, platform)).limit(1);
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: result[0].createdAt ? (typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()) : undefined,
      updatedAt: result[0].updatedAt ? (typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()) : undefined,
    } as any;
  }

  async updateSocialMediaIntegration(platform: string, data: Partial<InsertSocialMediaIntegration>): Promise<SocialMediaIntegration> {
    const existing = await this.getSocialMediaIntegration(platform);
    if (!db) throw new Error("Database not initialized");
    if (existing) {
      const result = await db.update(socialMediaIntegrationsTable).set({ ...data, updatedAt: new Date() } as any).where(eq(socialMediaIntegrationsTable.platform, platform)).returning();
      return {
          ...result[0],
          createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
          updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString(),
      } as SocialMediaIntegration;
    }
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(socialMediaIntegrationsTable).values({ id, platform: platform as any, ...data, createdAt: now, updatedAt: now } as any).returning();
    return {
          ...result[0],
          createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
          updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString(),
      } as SocialMediaIntegration;
  }

  async getCustomerInquiries(): Promise<CustomerInquiry[]> {
    if (!db) return [];
    const inquiries = await db.select().from(customerInquiriesTable);
    return inquiries.map(i => ({
        ...i,
        createdAt: typeof i.createdAt === 'string' ? i.createdAt : (i.createdAt as Date).toISOString()
    })) as CustomerInquiry[];
  }

  async createCustomerInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(customerInquiriesTable).values({ id, ...inquiry, createdAt: now } as any).returning();
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as CustomerInquiry;
  }

  async updateCustomerInquiry(id: string, inquiry: Partial<InsertCustomerInquiry>): Promise<CustomerInquiry | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(customerInquiriesTable).set(inquiry).where(eq(customerInquiriesTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as CustomerInquiry;
  }

  async deleteCustomerInquiry(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(customerInquiriesTable).where(eq(customerInquiriesTable.id, id));
    return true;
  }

  private resetCodeMap = new Map<string, { code: string; expiresAt: number }>();

  async storeResetCode(email: string, code: string): Promise<void> {
    const expiresAt = Date.now() + 15 * 60 * 1000;
    this.resetCodeMap.set(email, { code, expiresAt });
    setTimeout(() => this.resetCodeMap.delete(email), 15 * 60 * 1000);
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const stored = this.resetCodeMap.get(email);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.resetCodeMap.delete(email);
      return false;
    }
    const isValid = stored.code === code;
    if (isValid) {
      this.resetCodeMap.delete(email);
    }
    return isValid;
  }

  // Popup Forms Methods
  async getPopupForms(): Promise<PopupForm[]> {
    if (!db) throw new Error("Database not initialized");
    const forms = await db.select().from(popupFormsTable);
    return forms.map(f => ({
      ...f,
      createdAt: typeof f.createdAt === 'string' ? f.createdAt : (f.createdAt as Date).toISOString(),
      updatedAt: typeof f.updatedAt === 'string' ? f.updatedAt : (f.updatedAt as Date).toISOString()
    })) as PopupForm[];
  }

  async getPopupForm(id: string): Promise<PopupForm | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(popupFormsTable).where(eq(popupFormsTable.id, id));
    if (!result[0]) return undefined;
    
    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
      updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
    } as PopupForm;
  }

  async getActivePopupForm(): Promise<PopupForm | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(popupFormsTable).where(eq(popupFormsTable.enabled, true));
    if (!result[0]) return undefined;

    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
      updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
    } as PopupForm;
  }

  async createPopupForm(form: InsertPopupForm): Promise<PopupForm> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const now = new Date();
    const result = await db.insert(popupFormsTable).values({
      id,
      ...form,
      createdAt: now,
      updatedAt: now
    } as any).returning();

    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
      updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
    } as PopupForm;
  }

  async updatePopupForm(id: string, form: Partial<InsertPopupForm>): Promise<PopupForm | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(popupFormsTable)
      .set({ ...form, updatedAt: new Date() } as any)
      .where(eq(popupFormsTable.id, id))
      .returning();
      
    if (!result[0]) return undefined;

    return {
      ...result[0],
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
      updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
    } as PopupForm;
  }

  async deletePopupForm(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(popupFormsTable).where(eq(popupFormsTable.id, id));
    return true;
  }

  // Home Page Content Methods

  // Hero Content
  async getHeroContent(): Promise<HeroContent | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(heroContentTable).limit(1);
    if (!result[0]) return undefined;
    return {
      ...result[0],
      updatedAt: result[0].updatedAt ? (typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()) : undefined
    } as HeroContent;
  }

  async updateHeroContent(data: Partial<InsertHeroContent>): Promise<HeroContent> {
    if (!db) throw new Error("Database not initialized");
    const existing = await this.getHeroContent();
    if (existing) {
      const result = await db.update(heroContentTable).set({ ...data, updatedAt: new Date() }).where(eq(heroContentTable.id, existing.id)).returning();
      return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as HeroContent;
    }
    const id = randomUUID();
    const result = await db.insert(heroContentTable).values({ id, ...data, updatedAt: new Date() } as any).returning();
    return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as HeroContent;
  }

  // About Content
  async getAboutContent(): Promise<AboutContent | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(aboutContentTable).limit(1);
    if (!result[0]) return undefined;
    return {
      ...result[0],
      updatedAt: result[0].updatedAt ? (typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()) : undefined
    } as AboutContent;
  }

  async updateAboutContent(data: Partial<InsertAboutContent>): Promise<AboutContent> {
    if (!db) throw new Error("Database not initialized");
    const existing = await this.getAboutContent();
    if (existing) {
      const result = await db.update(aboutContentTable).set({ ...data, updatedAt: new Date() }).where(eq(aboutContentTable.id, existing.id)).returning();
      return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as AboutContent;
    }
    const id = randomUUID();
    const result = await db.insert(aboutContentTable).values({ id, ...data, updatedAt: new Date() } as any).returning();
    return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as AboutContent;
    }

  // About Values
  async getAboutValues(): Promise<AboutValue[]> {
    if (!db) throw new Error("Database not initialized");
    const values = await db.select().from(aboutValuesTable).orderBy(aboutValuesTable.order);
    return values.map(v => ({
      ...v,
      order: typeof v.order === 'string' ? parseInt(v.order) : v.order,
      createdAt: typeof v.createdAt === 'string' ? v.createdAt : (v.createdAt as Date).toISOString()
    })) as AboutValue[];
  }

  async createAboutValue(value: InsertAboutValue): Promise<AboutValue> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const result = await db.insert(aboutValuesTable).values({ 
      id, 
      ...value, 
      order: String(value.order),
      createdAt: new Date() 
    } as any).returning();
    return {
      ...result[0],
      order: typeof result[0].order === 'string' ? parseInt(result[0].order) : result[0].order,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as AboutValue;
  }

  async updateAboutValue(id: string, value: Partial<InsertAboutValue>): Promise<AboutValue | undefined> {
    if (!db) throw new Error("Database not initialized");
    const updateData: any = { ...value };
    if (value.order !== undefined) {
      updateData.order = String(value.order);
    }
    const result = await db.update(aboutValuesTable).set(updateData).where(eq(aboutValuesTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      order: typeof result[0].order === 'string' ? parseInt(result[0].order) : result[0].order,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as AboutValue;
  }

  async deleteAboutValue(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(aboutValuesTable).where(eq(aboutValuesTable.id, id));
    return true;
  }

  // Services Content
  async getServicesContent(): Promise<ServicesContent | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(servicesContentTable).limit(1);
    if (!result[0]) return undefined;
    return {
      ...result[0],
      updatedAt: result[0].updatedAt ? (typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()) : undefined
    } as ServicesContent;
  }

  async updateServicesContent(data: Partial<InsertServicesContent>): Promise<ServicesContent> {
    if (!db) throw new Error("Database not initialized");
    const existing = await this.getServicesContent();
    if (existing) {
      const result = await db.update(servicesContentTable).set({ ...data, updatedAt: new Date() }).where(eq(servicesContentTable.id, existing.id)).returning();
      return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as ServicesContent;
    }
    const id = randomUUID();
    const result = await db.insert(servicesContentTable).values({ id, ...data, updatedAt: new Date() } as any).returning();
    return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as ServicesContent;
    }

  // Service Items
  async getServiceItems(): Promise<ServiceItem[]> {
    if (!db) throw new Error("Database not initialized");
    const items = await db.select().from(serviceItemsTable);
    return items.map(item => ({
      ...item,
      order: typeof item.order === 'string' ? parseInt(item.order) : item.order,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.createdAt as Date).toISOString()
    })) as ServiceItem[];
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const result = await db.insert(serviceItemsTable).values({ 
      id, 
      ...item, 
      order: String(item.order),
      createdAt: new Date() 
    } as any).returning();
    return {
      ...result[0],
      order: typeof result[0].order === 'string' ? parseInt(result[0].order) : result[0].order,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as ServiceItem;
  }

  async updateServiceItem(id: string, item: Partial<InsertServiceItem>): Promise<ServiceItem | undefined> {
    if (!db) throw new Error("Database not initialized");
    const updateData: any = { ...item };
    if (item.order !== undefined) {
      updateData.order = String(item.order);
    }
    const result = await db.update(serviceItemsTable).set(updateData).where(eq(serviceItemsTable.id, id)).returning();
    if (!result[0]) return undefined;
    return {
      ...result[0],
      order: typeof result[0].order === 'string' ? parseInt(result[0].order) : result[0].order,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as ServiceItem;
  }

  async deleteServiceItem(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(serviceItemsTable).where(eq(serviceItemsTable.id, id));
    return true;
  }

  // Solutions Content
  async getSolutionsContent(): Promise<SolutionsContent | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(solutionsContentTable).limit(1);
    if (!result[0]) return undefined;
    return {
      ...result[0],
      updatedAt: result[0].updatedAt ? (typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()) : undefined
    } as SolutionsContent;
  }

  async updateSolutionsContent(data: Partial<InsertSolutionsContent>): Promise<SolutionsContent> {
    if (!db) throw new Error("Database not initialized");
    const existing = await this.getSolutionsContent();
    if (existing) {
      const result = await db.update(solutionsContentTable).set({ ...data, updatedAt: new Date() }).where(eq(solutionsContentTable.id, existing.id)).returning();
      return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as SolutionsContent;
    }
    const id = randomUUID();
    const result = await db.insert(solutionsContentTable).values({ id, ...data, updatedAt: new Date() } as any).returning();
    return {
        ...result[0],
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString()
      } as SolutionsContent;
    }

  // Solution Items
  async getSolutionItems(): Promise<SolutionItem[]> {
    if (!db) throw new Error("Database not initialized");
    const items = await db.select().from(solutionItemsTable);
    return items.map(item => ({
      ...item,
      features: typeof item.features === 'string' ? JSON.parse(item.features) : item.features,
      order: typeof item.order === 'string' ? parseInt(item.order) : item.order,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.createdAt as Date).toISOString()
    })) as SolutionItem[];
  }

  async createSolutionItem(item: InsertSolutionItem): Promise<SolutionItem> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const values = {
      id,
      ...item,
      features: JSON.stringify(item.features),
      order: String(item.order),
      createdAt: new Date()
    };
    const result = await db.insert(solutionItemsTable).values(values as any).returning();

    // Parse JSON string back to object for return
    const created = result[0];
    return {
      ...created,
      features: typeof created.features === 'string' ? JSON.parse(created.features) : created.features,
      order: typeof created.order === 'string' ? parseInt(created.order) : created.order,
      createdAt: typeof created.createdAt === 'string' ? created.createdAt : (created.createdAt as Date).toISOString()
    } as SolutionItem;
  }

  async updateSolutionItem(id: string, item: Partial<InsertSolutionItem>): Promise<SolutionItem | undefined> {
    if (!db) throw new Error("Database not initialized");
    const updateData: any = { ...item };
    if (item.features) {
      updateData.features = JSON.stringify(item.features);
    }
    if (item.order !== undefined) {
      updateData.order = String(item.order);
    }

    const result = await db.update(solutionItemsTable).set(updateData).where(eq(solutionItemsTable.id, id)).returning();
    if (!result[0]) return undefined;

    return {
      ...result[0],
      features: typeof result[0].features === 'string' ? JSON.parse(result[0].features) : result[0].features,
      order: typeof result[0].order === 'string' ? parseInt(result[0].order) : result[0].order,
      createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
    } as SolutionItem;
  }

  async deleteSolutionItem(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(solutionItemsTable).where(eq(solutionItemsTable.id, id));
    return true;
  }

  // ============== SOCIAL MEDIA AUTO-SYNC METHODS ==============

  async getSocialMediaSyncLogs(platform?: string, limit: number = 50): Promise<any[]> {
    try {
      if (!db) return [];
      let query = db.select().from(socialMediaSyncLogsTable);

      if (platform) {
        query = query.where(eq(socialMediaSyncLogsTable.platform, platform)) as any;
      }

      const logs = await query.limit(limit);

      return logs.map(log => ({
        ...log,
        metricsUpdated: log.metricsUpdated ? JSON.parse(log.metricsUpdated) : [],
        syncedAt: typeof log.syncedAt === 'string' ? log.syncedAt : (log.syncedAt as Date).toISOString()
      }));
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      return [];
    }
  }

  async createSocialMediaSyncLog(log: any): Promise<any> {
    try {
      const id = randomUUID();
      const now = new Date();

      const insertData = {
        id,
        platform: log.platform,
        syncType: log.syncType,
        status: log.status,
        metricsUpdated: log.metricsUpdated ? JSON.stringify(log.metricsUpdated) : null,
        errorMessage: log.errorMessage || null,
        syncedAt: now
      };

      if (!db) throw new Error("Database not initialized");
      const result = await db.insert(socialMediaSyncLogsTable).values(insertData as any).returning();

      return {
        ...result[0],
        metricsUpdated: result[0].metricsUpdated ? JSON.parse(result[0].metricsUpdated) : [],
        syncedAt: typeof result[0].syncedAt === 'string' ? result[0].syncedAt : (result[0].syncedAt as Date).toISOString()
      };
    } catch (error) {
      console.error("Error creating sync log:", error);
      throw error;
    }
  }

  async getSocialMediaApiConfigs(): Promise<any[]> {
    try {
      if (!db) throw new Error("Database not initialized");
      const configs = await db.select().from(socialMediaApiConfigTable);
      return configs.map(config => ({
        ...config,
        createdAt: typeof config.createdAt === 'string' ? config.createdAt : (config.createdAt as Date).toISOString(),
        updatedAt: typeof config.updatedAt === 'string' ? config.updatedAt : (config.updatedAt as Date).toISOString(),
        lastSyncAt: config.lastSyncAt ? (typeof config.lastSyncAt === 'string' ? config.lastSyncAt : (config.lastSyncAt as Date).toISOString()) : null,
        nextSyncAt: config.nextSyncAt ? (typeof config.nextSyncAt === 'string' ? config.nextSyncAt : (config.nextSyncAt as Date).toISOString()) : null
      }));
    } catch (error) {
      console.error("Error fetching API configs:", error);
      return [];
    }
  }

  async getSocialMediaApiConfig(platform: string): Promise<any | undefined> {
    try {
      if (!db) throw new Error("Database not initialized");
      const result = await db.select().from(socialMediaApiConfigTable)
        .where(eq(socialMediaApiConfigTable.platform, platform))
        .limit(1);

      if (!result[0]) return undefined;

      return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString(),
        lastSyncAt: result[0].lastSyncAt ? (typeof result[0].lastSyncAt === 'string' ? result[0].lastSyncAt : (result[0].lastSyncAt as Date).toISOString()) : null,
        nextSyncAt: result[0].nextSyncAt ? (typeof result[0].nextSyncAt === 'string' ? result[0].nextSyncAt : (result[0].nextSyncAt as Date).toISOString()) : null
      };
    } catch (error) {
      console.error("Error fetching API config:", error);
      return undefined;
    }
  }

  async updateSocialMediaApiConfig(platform: string, config: any): Promise<any> {
    try {
      const existing = await this.getSocialMediaApiConfig(platform);
      const now = new Date();

      if (existing) {
        if (!db) throw new Error("Database not initialized");
        const result = await db.update(socialMediaApiConfigTable)
          .set({ ...config, updatedAt: now } as any)
          .where(eq(socialMediaApiConfigTable.platform, platform))
          .returning();

        return {
          ...result[0],
          createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
          updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString(),
          lastSyncAt: result[0].lastSyncAt ? (typeof result[0].lastSyncAt === 'string' ? result[0].lastSyncAt : (result[0].lastSyncAt as Date).toISOString()) : null,
          nextSyncAt: result[0].nextSyncAt ? (typeof result[0].nextSyncAt === 'string' ? result[0].nextSyncAt : (result[0].nextSyncAt as Date).toISOString()) : null
        };
      }

      const id = randomUUID();
      const insertData = {
        id,
        platform,
        ...config,
        createdAt: now,
        updatedAt: now
      };

      if (!db) throw new Error("Database not initialized");
      const result = await db.insert(socialMediaApiConfigTable).values(insertData as any).returning();

      return {
        ...result[0],
        createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString(),
        updatedAt: typeof result[0].updatedAt === 'string' ? result[0].updatedAt : (result[0].updatedAt as Date).toISOString(),
        lastSyncAt: result[0].lastSyncAt ? (typeof result[0].lastSyncAt === 'string' ? result[0].lastSyncAt : (result[0].lastSyncAt as Date).toISOString()) : null,
        nextSyncAt: result[0].nextSyncAt ? (typeof result[0].nextSyncAt === 'string' ? result[0].nextSyncAt : (result[0].nextSyncAt as Date).toISOString()) : null
      };
    } catch (error) {
      console.error("Error updating API config:", error);
      throw error;
    }
  }

  async deleteSocialMediaApiConfig(platform: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not initialized");
      await db.delete(socialMediaApiConfigTable)
        .where(eq(socialMediaApiConfigTable.platform, platform));
      return true;
    } catch (error) {
      console.error("Error deleting API config:", error);
      return false;
    }
  }

  async getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]> {
    if (!db) return [];
    const results = await db.select().from(socialMediaAnalyticsTable);
    return results.map(r => ({
      ...r,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt as Date).toISOString()
    })) as unknown as SocialMediaAnalytics[];
  }

  async getSocialMediaAnalytic(platform: string): Promise<SocialMediaAnalytics | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(socialMediaAnalyticsTable)
        .where(eq(socialMediaAnalyticsTable.platform, platform))
        .limit(1);

      if (!result[0]) return undefined;

      return {
        ...result[0],
        createdAt: result[0].createdAt ? (typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()) : undefined
      } as unknown as SocialMediaAnalytics;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return undefined;
    }
  }

  async updateSocialMediaAnalytics(platform: string, data: any): Promise<SocialMediaAnalytics> {
    try {
      if (!db) throw new Error("Database not initialized");
      const existing = await this.getSocialMediaAnalytic(platform);
      const now = new Date();

      const id = randomUUID();
      
      // Parse numeric fields to integers
      const parsedData = {
        ...data,
        followersCount: data.followersCount ? parseInt(String(data.followersCount)) : 0,
        engagementRate: data.engagementRate ? parseInt(String(data.engagementRate)) : 0,
        impressions: data.impressions ? parseInt(String(data.impressions)) : 0,
        likes: data.likes ? parseInt(String(data.likes)) : 0,
        shares: data.shares ? parseInt(String(data.shares)) : 0,
        comments: data.comments ? parseInt(String(data.comments)) : 0,
        postsCount: data.postsCount ? parseInt(String(data.postsCount)) : 0,
      };

      if (existing) {
        const result = await db.update(socialMediaAnalyticsTable)
          .set({ ...parsedData, updatedAt: now })
          .where(eq(socialMediaAnalyticsTable.platform, platform))
          .returning();
        return {
          ...result[0],
          createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
        } as unknown as SocialMediaAnalytics;
      }

      const insertData = {
        id,
        platform,
        ...parsedData,
        createdAt: now,
        updatedAt: now
      };

      const result = await db.insert(socialMediaAnalyticsTable).values(insertData as any).returning();
      return {
          ...result[0],
          createdAt: typeof result[0].createdAt === 'string' ? result[0].createdAt : (result[0].createdAt as Date).toISOString()
        } as unknown as SocialMediaAnalytics;
    } catch (error) {
      console.error("Error updating analytics:", error);
      throw error;
    }
  }
}
