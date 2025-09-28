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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
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

export const upgrades = pgTable("upgrades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in pence
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

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
