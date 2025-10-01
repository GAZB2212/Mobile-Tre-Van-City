import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, json, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  specs: json("specs").$type<{
    transmission: string;
    size: string;
    fuel: string;
    doors?: number;
    engine?: string;
  }>().notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  heroImage: text("hero_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  published: boolean("published").notNull().default(true),
});

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  includes: json("includes").$type<string[]>().notNull().default([]),
  powerKw: decimal("power_kw").notNull(),
  price: integer("price").notNull(), // in pence
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
  "power"
] as const;

export const upgrades = pgTable("upgrades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in pence
  images: json("images").$type<string[]>().notNull().default([]),
  parentId: varchar("parent_id").references((): any => upgrades.id),
  variantName: text("variant_name"), // e.g., "Pack 1", "Pack 2", "Standard", "Premium"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  published: boolean("published").notNull().default(true),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userName: text("user_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  vanId: varchar("van_id").references(() => vans.id),
  kitId: varchar("kit_id").notNull().references(() => kits.id),
  selectedUpgradeIds: json("selected_upgrade_ids").$type<string[]>().notNull().default([]),
  financePlanId: varchar("finance_plan_id").references(() => financePlans.id),
  financeInputs: json("finance_inputs").$type<{
    deposit?: number;
    term?: number;
    balloon?: number;
  }>(),
  notes: text("notes"),
  estSubtotal: integer("est_subtotal").notNull(), // in pence
  estVAT: integer("est_vat").notNull(), // in pence
  estTotal: integer("est_total").notNull(), // in pence
  createdAt: timestamp("created_at").defaultNow(),
});

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
  password: z.string().min(6),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isAdmin: z.boolean().default(false),
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;

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
