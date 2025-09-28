import { 
  type User, type InsertUser,
  type Van, type InsertVan,
  type Kit, type InsertKit,
  type Upgrade, type InsertUpgrade,
  type Quote, type InsertQuote,
  type Lead, type InsertLead
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vans
  getVans(filters?: { make?: string; year?: number; maxPrice?: number; minPrice?: number; transmission?: string; size?: string }): Promise<Van[]>;
  getVan(id: string): Promise<Van | undefined>;
  getVanBySlug(slug: string): Promise<Van | undefined>;
  createVan(van: InsertVan): Promise<Van>;
  updateVan(id: string, van: Partial<InsertVan>): Promise<Van | undefined>;
  deleteVan(id: string): Promise<boolean>;

  // Kits
  getKits(): Promise<Kit[]>;
  getKit(id: string): Promise<Kit | undefined>;
  createKit(kit: InsertKit): Promise<Kit>;
  updateKit(id: string, kit: Partial<InsertKit>): Promise<Kit | undefined>;
  deleteKit(id: string): Promise<boolean>;

  // Upgrades
  getUpgrades(category?: string): Promise<Upgrade[]>;
  getUpgrade(id: string): Promise<Upgrade | undefined>;
  createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade>;
  updateUpgrade(id: string, upgrade: Partial<InsertUpgrade>): Promise<Upgrade | undefined>;
  deleteUpgrade(id: string): Promise<boolean>;

  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;

  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vans: Map<string, Van>;
  private kits: Map<string, Kit>;
  private upgrades: Map<string, Upgrade>;
  private quotes: Map<string, Quote>;
  private leads: Map<string, Lead>;

  constructor() {
    this.users = new Map();
    this.vans = new Map();
    this.kits = new Map();
    this.upgrades = new Map();
    this.quotes = new Map();
    this.leads = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed some demo data
    const sampleKits: Kit[] = [
      {
        id: "starter",
        name: "Starter Kit",
        description: "Perfect for small operations and getting started",
        includes: ["Tyre Changer", "Wheel Balancer", "Air Compressor"],
        powerKw: "3.5",
        price: 1250000,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "professional", 
        name: "Professional Kit",
        description: "Complete setup for professional mobile services",
        includes: ["Advanced Tyre Changer", "Digital Wheel Balancer", "High-Capacity Compressor", "Valve Tools"],
        powerKw: "5.2",
        price: 1850000,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "premium",
        name: "Premium Kit", 
        description: "Top-tier equipment for high-volume operations",
        includes: ["Premium Tyre Changer", "Laser Wheel Balancer", "Dual-Stage Compressor", "Complete Tool Set", "TPMS Tools"],
        powerKw: "7.8",
        price: 2450000,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const sampleVans: Van[] = [
      {
        id: "van-001",
        slug: "ford-transit-custom-2022",
        title: "Mobile Tyre Van - Ready to Go",
        make: "Ford",
        model: "Transit Custom",
        year: 2022,
        mileage: 15000,
        price: 4500000,
        vatIncluded: false,
        specs: {
          transmission: "Manual",
          size: "LWB",
          fuel: "Diesel",
          doors: 4,
          engine: "2.0L EcoBlue"
        },
        images: [],
        heroImage: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "van-002",
        slug: "mercedes-sprinter-2023",
        title: "Premium Mobile Workshop",
        make: "Mercedes",
        model: "Sprinter",
        year: 2023,
        mileage: 8500,
        price: 5200000,
        vatIncluded: false,
        specs: {
          transmission: "Automatic",
          size: "LWB",
          fuel: "Diesel",
          doors: 4,
          engine: "2.1L CDI"
        },
        images: [],
        heroImage: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "van-003",
        slug: "volkswagen-crafter-2021",
        title: "Compact Tyre Service Van",
        make: "Volkswagen",
        model: "Crafter",
        year: 2021,
        mileage: 22000,
        price: 3800000,
        vatIncluded: false,
        specs: {
          transmission: "Manual",
          size: "SWB",
          fuel: "Diesel",
          doors: 2,
          engine: "2.0L TDI"
        },
        images: [],
        heroImage: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const sampleUpgrades: Upgrade[] = [
      {
        id: "lighting-led",
        name: "LED Lighting Package",
        category: "lighting",
        description: "Professional LED lighting for work area",
        price: 89500,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "cctv-system",
        name: "CCTV Security System",
        category: "security",
        description: "4-camera security system with recording",
        price: 149500,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "shelving-racking",
        name: "Professional Racking System",
        category: "storage",
        description: "Heavy-duty shelving and tool storage",
        price: 67500,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "inverter-3kw",
        name: "3kW Power Inverter",
        category: "power",
        description: "High-capacity power inverter for equipment",
        price: 125000,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "vehicle-wrap",
        name: "Professional Vehicle Wrap",
        category: "branding",
        description: "Custom vehicle wrap with your branding",
        price: 189500,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleKits.forEach(kit => this.kits.set(kit.id, kit));
    sampleVans.forEach(van => this.vans.set(van.id, van));
    sampleUpgrades.forEach(upgrade => this.upgrades.set(upgrade.id, upgrade));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Vans
  async getVans(filters?: { make?: string; year?: number; maxPrice?: number; minPrice?: number; transmission?: string; size?: string }): Promise<Van[]> {
    let vans = Array.from(this.vans.values()).filter(van => van.published);
    
    if (filters) {
      if (filters.make) {
        vans = vans.filter(van => van.make.toLowerCase().includes(filters.make!.toLowerCase()));
      }
      if (filters.year) {
        vans = vans.filter(van => van.year >= filters.year!);
      }
      if (filters.minPrice) {
        vans = vans.filter(van => van.price >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        vans = vans.filter(van => van.price <= filters.maxPrice!);
      }
      if (filters.transmission) {
        vans = vans.filter(van => van.specs.transmission.toLowerCase() === filters.transmission!.toLowerCase());
      }
      if (filters.size) {
        vans = vans.filter(van => van.specs.size.toLowerCase() === filters.size!.toLowerCase());
      }
    }
    
    return vans;
  }

  async getVan(id: string): Promise<Van | undefined> {
    return this.vans.get(id);
  }

  async getVanBySlug(slug: string): Promise<Van | undefined> {
    return Array.from(this.vans.values()).find(van => van.slug === slug);
  }

  async createVan(insertVan: InsertVan): Promise<Van> {
    const id = randomUUID();
    const van: Van = { 
      ...insertVan, 
      id,
      vatIncluded: insertVan.vatIncluded ?? false,
      images: Array.isArray(insertVan.images) ? insertVan.images : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.vans.set(id, van);
    return van;
  }

  async updateVan(id: string, insertVan: Partial<InsertVan>): Promise<Van | undefined> {
    const existing = this.vans.get(id);
    if (!existing) return undefined;
    
    const updated: Van = { 
      ...existing, 
      ...insertVan,
      vatIncluded: insertVan.vatIncluded ?? existing.vatIncluded,
      images: Array.isArray(insertVan.images) ? insertVan.images : existing.images,
      updatedAt: new Date()
    };
    this.vans.set(id, updated);
    return updated;
  }

  async deleteVan(id: string): Promise<boolean> {
    return this.vans.delete(id);
  }

  // Kits
  async getKits(): Promise<Kit[]> {
    return Array.from(this.kits.values()).filter(kit => kit.published);
  }

  async getKit(id: string): Promise<Kit | undefined> {
    return this.kits.get(id);
  }

  async createKit(insertKit: InsertKit): Promise<Kit> {
    const id = randomUUID();
    const kit: Kit = { 
      ...insertKit, 
      id,
      includes: Array.isArray(insertKit.includes) ? insertKit.includes : [],
      published: insertKit.published ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.kits.set(id, kit);
    return kit;
  }

  async updateKit(id: string, insertKit: Partial<InsertKit>): Promise<Kit | undefined> {
    const existing = this.kits.get(id);
    if (!existing) return undefined;
    
    const updated: Kit = { 
      ...existing, 
      ...insertKit,
      includes: Array.isArray(insertKit.includes) ? insertKit.includes : existing.includes,
      published: insertKit.published ?? existing.published,
      updatedAt: new Date()
    };
    this.kits.set(id, updated);
    return updated;
  }

  async deleteKit(id: string): Promise<boolean> {
    return this.kits.delete(id);
  }

  // Upgrades
  async getUpgrades(category?: string): Promise<Upgrade[]> {
    let upgrades = Array.from(this.upgrades.values()).filter(upgrade => upgrade.published);
    
    if (category) {
      upgrades = upgrades.filter(upgrade => upgrade.category === category);
    }
    
    return upgrades;
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    return this.upgrades.get(id);
  }

  async createUpgrade(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const id = randomUUID();
    const upgrade: Upgrade = { 
      ...insertUpgrade, 
      id,
      published: insertUpgrade.published ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.upgrades.set(id, upgrade);
    return upgrade;
  }

  async updateUpgrade(id: string, insertUpgrade: Partial<InsertUpgrade>): Promise<Upgrade | undefined> {
    const existing = this.upgrades.get(id);
    if (!existing) return undefined;
    
    const updated: Upgrade = { 
      ...existing, 
      ...insertUpgrade,
      updatedAt: new Date()
    };
    this.upgrades.set(id, updated);
    return updated;
  }

  async deleteUpgrade(id: string): Promise<boolean> {
    return this.upgrades.delete(id);
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = randomUUID();
    const quote: Quote = { 
      ...insertQuote, 
      id,
      company: insertQuote.company ?? null,
      vanId: insertQuote.vanId ?? null,
      selectedUpgradeIds: Array.isArray(insertQuote.selectedUpgradeIds) ? insertQuote.selectedUpgradeIds : [],
      notes: insertQuote.notes ?? null,
      createdAt: new Date()
    };
    this.quotes.set(id, quote);
    return quote;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      ...insertLead, 
      id,
      phone: insertLead.phone ?? null,
      message: insertLead.message ?? null,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }
}

export const storage = new MemStorage();
