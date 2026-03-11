import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, json, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin role types
export const adminRoles = ["none", "basic", "full"] as const;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  adminRole: text("admin_role").notNull().default("none"), // "none", "basic", or "full"
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vans = pgTable("vans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  price: integer("price").notNull(), // in pence
  vatIncluded: boolean("vat_included").notNull().default(false),
  euroStatus: text("euro_status"), // e.g., "Euro 6", "Euro 5", "Euro 4"
  specs: json("specs").$type<{
    transmission: string;
    size: string;
    fuel: string;
    doors?: number;
    engine?: string;
  }>().notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  heroImage: text("hero_image"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  published: boolean("published").notNull().default(true),
});

export const kitServiceTypes = ["all", "car", "commercial", "hybrid"] as const;
export type KitServiceType = typeof kitServiceTypes[number];

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  includes: json("includes").$type<string[]>().notNull().default([]),
  powerKw: decimal("power_kw").notNull(),
  price: integer("price").notNull(), // in pence
  euroSixCompatible: boolean("euro_six_compatible").notNull().default(false), // True for Euro 6 compatible kits
  serviceType: varchar("service_type").notNull().default("all"), // "all" | "car" | "commercial" | "hybrid"
  images: json("images").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  published: boolean("published").notNull().default(true),
});

// Upgrade categories enum
export const upgradeCategories = [
  "air-systems",
  "equipment", 
  "branding",
  "security",
  "lighting",
  "business",
  "technology",
  "comfort",
  "storage",
  "safety",
  "power",
  "accessories"
] as const;

// Quote status enums
export const quoteStatuses = [
  "new",              // Customer submitted, not yet called
  "contacted",        // Staff called and went through configurator
  "awaiting_deposit", // Customer happy, waiting for deposit payment
  "awaiting_finance", // Sent to finance company, awaiting decision
  "deposit_taken",    // Deposit received — ready for build
  "finance_approved", // Finance company approved — ready for build
  "in_build",         // Build underway, build sheet generated
  "completed",        // Van built and delivered
  "cancelled",        // Cancelled
] as const;
export const buildStages = ["graphics", "electrical_systems", "accessories", "emergency_lighting", "tyre_equipment", "final_checks", "valet"] as const;
export const financeStatuses = ["pending", "approved", "declined", "more_info_needed"] as const;
export const discountTypes = ["percentage", "fixed"] as const;

export const upgrades = pgTable("upgrades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  detailedInfo: text("detailed_info"), // Extended information shown in "More Info" modal
  price: integer("price").notNull(), // in pence
  images: json("images").$type<string[]>().notNull().default([]),
  videoUrl: text("video_url"), // YouTube, Vimeo, or direct video URL
  showVideo: boolean("show_video").notNull().default(false), // Toggle to show/hide video in More Info modal
  parentId: varchar("parent_id").references((): any => upgrades.id),
  variantName: text("variant_name"), // e.g., "Pack 1", "Pack 2", "Standard", "Premium"
  allowQuantity: boolean("allow_quantity").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  popular: boolean("popular").notNull().default(false), // Mark as popular upgrade
  exclusiveGroup: text("exclusive_group"), // If set, only one upgrade in this group can be selected at a time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  published: boolean("published").notNull().default(true),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  vanId: varchar("van_id").references(() => vans.id),
  kitId: varchar("kit_id").references(() => kits.id),
  selectedUpgradeIds: json("selected_upgrade_ids").$type<string[]>().notNull().default([]),
  selectedUpgrades: json("selected_upgrades").$type<Record<string, number>>().notNull().default({}),
  trainingOptionIds: json("training_option_ids").$type<string[]>().notNull().default([]),
  financePlanId: varchar("finance_plan_id").references(() => financePlans.id),
  financeInputs: json("finance_inputs").$type<{
    deposit?: number;
    term?: number;
    balloon?: number;
  }>(),
  notes: text("notes"),
  estSubtotal: integer("est_subtotal").notNull(), // in pence (base price before discount)
  estDiscount: integer("est_discount").notNull().default(0), // in pence (calculated discount amount)
  estVAT: integer("est_vat").notNull(), // in pence (calculated after discount)
  estTotal: integer("est_total").notNull(), // in pence (final price after discount)
  
  // Admin adjustments
  discountType: text("discount_type"), // "percentage" or "fixed"
  discountValue: integer("discount_value"), // percentage (e.g., 10 = 10%) or pence amount
  adminNotesHistory: json("admin_notes_history").$type<Array<{text: string; timestamp: string; author?: string}>>().notNull().default([]), // Internal notes history for staff
  customerNotesHistory: json("customer_notes_history").$type<Array<{text: string; timestamp: string; author?: string}>>().notNull().default([]), // Customer notes history
  
  // Quote confirmation
  confirmationToken: text("confirmation_token").unique(), // Unique token for customer confirmation link
  confirmedAt: timestamp("confirmed_at"), // When customer confirmed the quote

  // Finance submission
  customerConfirmed: boolean("customer_confirmed").notNull().default(false), // Customer verbally confirmed their config
  vanRegistration: text("van_registration"), // Specific van registration plate for finance submission
  vanMileage: integer("van_mileage"), // Current van mileage for finance submission
  financeSentAt: timestamp("finance_sent_at"), // When finance submission email was last sent
  
  featuredInPortfolio: boolean("featured_in_portfolio").notNull().default(false),
  status: text("status").notNull().default("pending"),
  buildStage: text("build_stage"),
  completedBuildStages: json("completed_build_stages").$type<string[]>().notNull().default([]),
  financeStatus: text("finance_status").notNull().default("pending"),
  graphicsArtworkUrl: text("graphics_artwork_url"),
  graphicsArtworkApproved: boolean("graphics_artwork_approved").notNull().default(false),
  graphicsArtworkNotes: text("graphics_artwork_notes"),
  customerLogoUrls: json("customer_logo_urls").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_quotes_user_id").on(table.userId),
  index("idx_quotes_status").on(table.status),
  index("idx_quotes_build_stage").on(table.buildStage),
]);

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financePlans = pgTable("finance_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "HP" or "Lease"
  termMonths: integer("term_months").notNull(),
  aprBps: integer("apr_bps").notNull(), // APR in basis points (e.g., 595 = 5.95%)
  depositPercent: integer("deposit_percent").notNull(), // Deposit percentage (e.g., 10 = 10%)
  balloonPercent: integer("balloon_percent"), // Optional balloon payment percentage
  notes: text("notes"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trainingOptions = pgTable("training_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // e.g., "REACT", "Tyre Fitting"
  durationDays: integer("duration_days").notNull(), // Duration in days
  includes: json("includes").$type<string[]>().notNull().default([]),
  price: integer("price").notNull(), // in pence
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const galleryItems = pgTable("gallery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(), // e.g., "Complete Builds", "Interior Layouts"
  type: text("type").notNull(), // "image" or "video"
  fileUrl: text("file_url").notNull(), // URL to the uploaded file in object storage
  thumbnailUrl: text("thumbnail_url"), // Optional thumbnail for videos
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email({ message: "A valid email is required to send the set-password link" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isAdmin: z.boolean().default(false),
  adminRole: z.enum(adminRoles).default("none"),
});

export const updateUserRoleSchema = z.object({
  adminRole: z.enum(adminRoles),
});

export const insertVanSchema = createInsertSchema(vans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKitSchema = createInsertSchema(kits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUpgradeSchema = createInsertSchema(upgrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(quoteStatuses).optional(),
  buildStage: z.enum(buildStages).nullable().optional(),
  financeStatus: z.enum(financeStatuses).optional(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertFinancePlanSchema = createInsertSchema(financePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingOptionSchema = createInsertSchema(trainingOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type AdminRole = typeof adminRoles[number];
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;

export type InsertVan = z.infer<typeof insertVanSchema>;
export type Van = typeof vans.$inferSelect;

export type InsertKit = z.infer<typeof insertKitSchema>;
export type Kit = typeof kits.$inferSelect;

export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
export type Upgrade = typeof upgrades.$inferSelect;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertFinancePlan = z.infer<typeof insertFinancePlanSchema>;
export type FinancePlan = typeof financePlans.$inferSelect;

export type InsertTrainingOption = z.infer<typeof insertTrainingOptionSchema>;
export type TrainingOption = typeof trainingOptions.$inferSelect;

export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

// Site settings table for storing configurable values like video URLs
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ============================================================
// Web Analytics Tables
// ============================================================

export const analyticsSessions = pgTable("analytics_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type"), // mobile, tablet, desktop
  browser: varchar("browser"),
  os: varchar("os"),
  ipHash: varchar("ip_hash"),
  referrer: text("referrer"),
  utmSource: varchar("utm_source"),
  utmMedium: varchar("utm_medium"),
  utmCampaign: varchar("utm_campaign"),
  utmTerm: varchar("utm_term"),
  utmContent: varchar("utm_content"),
  entryPage: text("entry_page"),
  exitPage: text("exit_page"),
  pageCount: integer("page_count").default(1),
  bounce: boolean("bounce").default(true),
  durationSeconds: integer("duration_seconds"),
  startedAt: timestamp("started_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
}, (table) => [
  index("idx_sessions_session_id").on(table.sessionId),
  index("idx_sessions_started_at").on(table.startedAt),
]);

export const analyticsPageviews = pgTable("analytics_pageviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pageviews_session").on(table.sessionId),
  index("idx_pageviews_created").on(table.createdAt),
]);

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  eventName: varchar("event_name").notNull(),
  eventData: jsonb("event_data"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_events_session").on(table.sessionId),
  index("idx_events_name").on(table.eventName),
  index("idx_events_created").on(table.createdAt),
]);

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type AnalyticsPageview = typeof analyticsPageviews.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
