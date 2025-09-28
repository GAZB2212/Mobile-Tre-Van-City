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
  // Users (Replit Auth compatible)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  promoteToAdmin(userId: string): Promise<User | undefined>;
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
    // Real MTVC kit data from Jotform
    const sampleKits: Kit[] = [
      {
        id: "pack-1-non-euro6-t1000",
        name: "Pack 1 - Non Euro 6 with T1000 Pro & Mini Spin",
        description: "Complete mobile tyre fitting setup with T1000 Pro tyre changer and Mini Spin wheel balancer for Non Euro 6 vehicles",
        includes: ["T1000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Air Compressor", "Basic Tool Set"],
        powerKw: "3.5",
        price: 574500, // £5,745.00 in pence
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pack-2-euro6-t1000",
        name: "Pack 2 - Euro 6 with T1000 Pro & Mini Spin",
        description: "Complete mobile tyre fitting setup with T1000 Pro tyre changer and Mini Spin wheel balancer for Euro 6 vehicles",
        includes: ["T1000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Euro 6 Compatible Air System", "Basic Tool Set"],
        powerKw: "3.5",
        price: 594500, // Estimated £5,945.00 in pence
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pack-3-non-euro6-t2000",
        name: "Pack 3 - Non Euro 6 with T2000 Pro & Mini Spin",
        description: "Advanced mobile tyre fitting setup with T2000 Pro tyre changer and Mini Spin wheel balancer for Non Euro 6 vehicles",
        includes: ["T2000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "High-Capacity Air Compressor", "Professional Tool Set"],
        powerKw: "5.0",
        price: 644500, // Estimated £6,445.00 in pence
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pack-4-euro6-t2000",
        name: "Pack 4 - Euro 6 with T2000 Pro & Mini Spin",
        description: "Premium mobile tyre fitting setup with T2000 Pro tyre changer and Mini Spin wheel balancer for Euro 6 vehicles",
        includes: ["T2000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Euro 6 Compatible High-Capacity Air System", "Professional Tool Set"],
        powerKw: "5.0",
        price: 664500, // Estimated £6,645.00 in pence
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
      // Air System Upgrades
      {
        id: "mounted-pto-air-system",
        name: "Mounted PTO Air System Upgrade",
        category: "air-systems",
        description: "MTVC40, 40CFM rotary screw compressor - perfect for mobile tyre fitting vehicles with compact, powerful design",
        price: 549500, // £5,495.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "compressor-12hp-270l",
        name: "Compressor Upgrade To 12hp 270 Litre Electric Start",
        category: "air-systems",
        description: "High-capacity 12hp compressor with 270 litre tank and electric start",
        price: 100000, // £1,000.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "air-reel-9m-fini",
        name: "Fini 9 meter Air Reel With Built In Compressor",
        category: "air-systems",
        description: "Professional 9 meter air reel with built-in compressor",
        price: 24500, // £245.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "compressor-reel-15m",
        name: "15m Compressor Reel",
        category: "air-systems",
        description: "Keep your air lines neat and tidy with our compressor reel",
        price: 17500, // £175.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Equipment Upgrades
      {
        id: "super-spin-upgrade",
        name: "Upgrade to Super Spin auto spin wheel balancer",
        category: "equipment",
        description: "Upgrade your wheel balancer to Super Spin auto spin technology",
        price: 45000, // £450.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Branding & Wrapping
      {
        id: "full-bespoke-wrap",
        name: "Full Bespoke Wrap",
        category: "branding",
        description: "Give your van kerb appeal with bespoke full van wrap (LWB/MWB available)",
        price: 320000, // £3,200.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "half-wrap",
        name: "Half Wrap",
        category: "branding",
        description: "Give your van the WOW factor with a half wrap (LWB/MWB available)",
        price: 180000, // £1,800.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "graphic-pack",
        name: "Graphic Pack",
        category: "branding",
        description: "Vehicle graphic pack with printed panels on sides and rear, text on doors and rear doors",
        price: 100000, // £1,000.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Security & CCTV
      {
        id: "van-cctv-system",
        name: "Van Online CCTV/DVR System",
        category: "security",
        description: "4-6 camera online/offline CCTV system for extra security and peace of mind",
        price: 220000, // £2,200.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "vehicle-immobiliser",
        name: "Vehicle Immobiliser",
        category: "security",
        description: "Most advanced vehicle immobiliser on the market to protect your business asset",
        price: 50000, // £500.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "vehicle-tracker",
        name: "Vehicle Tracker",
        category: "security",
        description: "Vehicle tracker with app to track your vehicle",
        price: 35000, // £350.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Lighting
      {
        id: "light-pack",
        name: "Light Pack",
        category: "lighting",
        description: "8 LED flashing repeaters, LED light bar to roof & working lights. Optional upgrade to LED scene lights",
        price: 120000, // £1,200.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Business Setup
      {
        id: "business-package",
        name: "All You Need Business Package",
        category: "business",
        description: "Website, business cards, leaflets, & social media setup (max 2 platforms)",
        price: 155000, // £1,550.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "branded-website",
        name: "Branded Website",
        category: "business",
        description: "Fully branded website for your business (from £1050+VAT depending on specification)",
        price: 105000, // £1,050.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Technology & Comfort
      {
        id: "remote-control",
        name: "Remote Control",
        category: "technology",
        description: "Control all of your van's accessories with wireless remote system",
        price: 69500, // £695.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "apple-carplay",
        name: "Apple CarPlay",
        category: "technology",
        description: "Apple CarPlay or Android Auto (vehicle dependent, starting price)",
        price: 65000, // £650.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "heated-seat",
        name: "Heated Seat",
        category: "comfort",
        description: "Heated driver's seat to keep warm on cold winter days",
        price: 55000, // £550.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Storage & Tools
      {
        id: "tyre-racking",
        name: "Tyre Racking",
        category: "storage",
        description: "Professional tyre storage racking (tyres not included)",
        price: 49500, // £495.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "tool-chest-155pc",
        name: "155 Piece Neilsen Tool Chest",
        category: "storage",
        description: "Complete 155 piece professional tool chest",
        price: 45000, // £450.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Safety
      {
        id: "chapter-8-livery",
        name: "Rear Chapter 8 Livery",
        category: "safety",
        description: "Fluorescent and reflective chapter 8 kit for roadside visibility",
        price: 45000, // £450.00
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Power Systems
      {
        id: "lifepo4-battery-200ah",
        name: "200ah LiFePO4 Battery Upgrade and Brackets",
        category: "power",
        description: "Upgrade your battery system to 200ah for longer lasting power",
        price: 30000, // £300.00
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    
    // Check if user should be admin based on environment variable
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const shouldBeAdmin = adminUserIds.includes(userData.id);
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        isAdmin: shouldBeAdmin || existingUser.isAdmin, // Preserve existing admin status or set based on env
        updatedAt: new Date()
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        ...userData,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        isAdmin: shouldBeAdmin,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async promoteToAdmin(userId: string): Promise<User | undefined> {
    const existingUser = this.users.get(userId);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      isAdmin: true,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
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
      images: (insertVan.images && Array.isArray(insertVan.images)) ? insertVan.images : [],
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
