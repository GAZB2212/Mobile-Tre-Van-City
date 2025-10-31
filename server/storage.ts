import { 
  type User, type InsertUser,
  type Van, type InsertVan,
  type Kit, type InsertKit,
  type Upgrade, type InsertUpgrade,
  type Quote, type InsertQuote,
  type Lead, type InsertLead,
  type FinancePlan, type InsertFinancePlan,
  type TrainingOption, type InsertTrainingOption
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vans
  getVans(filters?: { make?: string; year?: number; maxPrice?: number; minPrice?: number; transmission?: string; size?: string }): Promise<Van[]>;
  getVansAdmin(): Promise<Van[]>; // Returns all vans including unpublished for admin
  getVan(id: string): Promise<Van | undefined>;
  getVanBySlug(slug: string): Promise<Van | undefined>;
  createVan(van: InsertVan): Promise<Van>;
  updateVan(id: string, van: Partial<InsertVan>): Promise<Van | undefined>;
  deleteVan(id: string): Promise<boolean>;

  // Kits
  getKits(): Promise<Kit[]>;
  getKitsAdmin(): Promise<Kit[]>; // Returns all kits including unpublished for admin
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
  updateQuote(id: string, quote: Partial<Quote>): Promise<Quote | undefined>;

  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;

  // Finance Plans
  getFinancePlans(): Promise<FinancePlan[]>;
  getFinancePlan(id: string): Promise<FinancePlan | undefined>;
  createFinancePlan(plan: InsertFinancePlan): Promise<FinancePlan>;
  updateFinancePlan(id: string, plan: Partial<InsertFinancePlan>): Promise<FinancePlan | undefined>;
  deleteFinancePlan(id: string): Promise<boolean>;

  // Training Options
  getTrainingOptions(): Promise<TrainingOption[]>;
  getTrainingOption(id: string): Promise<TrainingOption | undefined>;
  createTrainingOption(option: InsertTrainingOption): Promise<TrainingOption>;
  updateTrainingOption(id: string, option: Partial<InsertTrainingOption>): Promise<TrainingOption | undefined>;
  deleteTrainingOption(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vans: Map<string, Van>;
  private kits: Map<string, Kit>;
  private upgrades: Map<string, Upgrade>;
  private quotes: Map<string, Quote>;
  private leads: Map<string, Lead>;
  private financePlans: Map<string, FinancePlan>;
  private trainingOptions: Map<string, TrainingOption>;

  constructor() {
    this.users = new Map();
    this.vans = new Map();
    this.kits = new Map();
    this.upgrades = new Map();
    this.quotes = new Map();
    this.leads = new Map();
    this.financePlans = new Map();
    this.trainingOptions = new Map();
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
        sortOrder: 0,
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
        sortOrder: 1,
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
        sortOrder: 2,
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
        sortOrder: 3,
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
      // Accessories Parent (for variations)
      {
        id: "accessories-parent",
        name: "Accessories",
        category: "equipment",
        description: "Choose your equipment package - Maxi Euro 8 with T5000/T6000 Pro & Mini Spin",
        price: 114500,
        images: [],
        parentId: null,
        variantName: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "accessories-pack-1",
        name: "Accessories Pack 1",
        category: "equipment",
        description: "Maxi Euro 8 with T5000 Pro & Mini Spin",
        price: 114500,
        images: [],
        parentId: "accessories-parent",
        variantName: "Pack 1 - Maxi Euro 8 with T5000 Pro & Mini Spin",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "accessories-pack-2",
        name: "Accessories Pack 2",
        category: "equipment",
        description: "Euro 8 with T5000 Pro & Mini Spin",
        price: 114500,
        images: [],
        parentId: "accessories-parent",
        variantName: "Pack 2 - Euro 8 with T5000 Pro & Mini Spin",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "accessories-pack-3",
        name: "Accessories Pack 3",
        category: "equipment",
        description: "Mini Euro 8 with T5000 Pro & Mini Spin",
        price: 114500,
        images: [],
        parentId: "accessories-parent",
        variantName: "Pack 3 - Mini Euro 8 with T5000 Pro & Mini Spin",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "accessories-pack-4",
        name: "Accessories Pack 4",
        category: "equipment",
        description: "Maxi Euro 8 with T6000 Pro & Mini Spin",
        price: 114500,
        images: [],
        parentId: "accessories-parent",
        variantName: "Pack 4 - Maxi Euro 8 with T6000 Pro & Mini Spin",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Air System Upgrades
      {
        id: "mounted-pto-air-system",
        name: "Mounted PTO Air System Upgrade",
        category: "air-systems",
        description: "Professional air system for mobile tyre fitting vehicles. We compound, powerful design for truly engineered for integrated into commercial vehicles",
        price: 449500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "compressor-12hp-270l",
        name: "Compressor Upgrade To 12hp 270 Litre Electric Start",
        category: "air-systems",
        description: "HEAVY DUTY compressor pump only",
        price: 100000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "air-reel-fini",
        name: "Fini 9 meter Air Reel With Built In Compressor",
        category: "air-systems",
        description: "Professional 9 meter air reel with built-in compressor",
        price: 54500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "compressor-reel-16m",
        name: "16m Compressor Reel",
        category: "air-systems",
        description: "Keep your air line well and out Kay. With our compressor reel",
        price: 17500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Equipment
      {
        id: "super-spin-upgrade",
        name: "Upgrade to Super Spin auto spin wheel balancer",
        category: "equipment",
        description: "",
        price: 45000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Branding
      {
        id: "full-revalco-wrap",
        name: "Full Revalco Wrap",
        category: "branding",
        description: "Give your van kerb appeal by having blowable full van wrap (LWB / MWB available)",
        price: 320000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "half-wrap",
        name: "Half Wrap",
        category: "branding",
        description: "Give your van the WOW factor with a half wrap",
        price: 180000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "graphic-pack",
        name: "Graphic Pack",
        category: "branding",
        description: "Add vehicle graphic pack (printed places on scores and rear, text on doors and rear sound)",
        price: 100000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "rear-chapter-livery",
        name: "Rear Chapter & Livery",
        category: "branding",
        description: "Make sure you are aware at the back of the road with our fluorescent yellow day chapter & kit",
        price: 45000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "branded-website",
        name: "Branded Website",
        category: "branding",
        description: "Have your very own branded website. Price is £1050+vat depending on your specification",
        price: 105000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "full-print-package",
        name: "Full Print Package",
        category: "branding",
        description: "500 Business cards, 250 Leaflets, 5 Social media setup (Max 2 platforms)",
        price: 55000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "garage-branding",
        name: "Garage Branding (Member of team will contact you for pricing)",
        category: "branding",
        description: "Reactivate branding: Graphic signage, Pivot, A Boards, banners",
        price: 1,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Van Interior Walls (with variations)
      {
        id: "van-interior-walls-parent",
        name: "Van Interior Walls",
        category: "comfort",
        description: "Line the interior of your van with white coating to protect your van",
        price: 160000,
        images: [],
        parentId: null,
        variantName: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "van-interior-diamond-lwb-standard",
        name: "Van Interior Walls - Diamond Liner LWB Standard",
        category: "comfort",
        description: "Line the interior of your van with white coating to protect your van",
        price: 160000,
        images: [],
        parentId: "van-interior-walls-parent",
        variantName: "Diamond Liner - LWB Standard",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "van-interior-diamond-lwb-branded",
        name: "Van Interior Walls - Diamond Liner LWB Branded",
        category: "comfort",
        description: "Line the interior of your van with white coating to protect your van - with branding",
        price: 160000,
        images: [],
        parentId: "van-interior-walls-parent",
        variantName: "Diamond Liner - LWB Branded",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Security
      {
        id: "van-cctv-system",
        name: "Van Online CCTV/NVR System",
        category: "security",
        description: "Add extra security and peace of mind to your van with our online / offline CCTV system",
        price: 220000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "vehicle-immobiliser",
        name: "Vehicle Immobiliser",
        category: "security",
        description: "Most advanced vehicle immobiliser on the market to protect your business asset",
        price: 50000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "vehicle-tracker",
        name: "Vehicle tracker",
        category: "security",
        description: "With App to track your vehicle",
        price: 35000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "high-security-door-lock",
        name: "High Security Door Lock",
        category: "security",
        description: "Add extra security to your van with our high security locks",
        price: 19500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "standard-reversing-camera",
        name: "Standard Reversing Camera Kit",
        category: "security",
        description: "Standard reversing camera with 7\" monitor",
        price: 49500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Business
      {
        id: "business-package",
        name: "All you need business package",
        category: "business",
        description: "Website, Business cards, Leaflets, & Social media setup (Max 2 platforms)",
        price: 195000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Lighting Parent (with variations)
      {
        id: "light-pack-parent",
        name: "Light Pack",
        category: "lighting",
        description: "8 LED flashing repeaters, LED light bar to roof & working lights. With the optional upgrade you get LED scene lights",
        price: 120000,
        images: [],
        parentId: null,
        variantName: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "light-pack-standard",
        name: "Standard Light Pack",
        category: "lighting",
        description: "8 LED flashing repeaters, LED light bar to roof & working lights",
        price: 120000,
        images: [],
        parentId: "light-pack-parent",
        variantName: "Standard Light Pack",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "light-pack-upgraded",
        name: "Upgraded Light Pack",
        category: "lighting",
        description: "8 LED flashing repeaters, LED light bar to roof & working lights to side and rear of van. Upgraded to LED scene lights with side marker lights to side and rear",
        price: 170000,
        images: [],
        parentId: "light-pack-parent",
        variantName: "Upgraded Light Pack - LED Scene Lights",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Technology
      {
        id: "remote-control",
        name: "Remote Control",
        category: "technology",
        description: "Control all of your vans accessories with our wireless remote system",
        price: 69500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "monitor-brake-light-camera",
        name: "7\" Monitor With Brake Light Camera",
        category: "technology",
        description: "In cab 'plant' device always recording when driving",
        price: 49500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "apple-carplay",
        name: "Apple CarPlay",
        category: "technology",
        description: "Apple CarPlay or Android Auto (vehicle dependent, starting from £650+vat, a member of our team will confirm that your ice vehicle package right, once order is placed)",
        price: 65000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "front-facing-dash-camera",
        name: "Front Facing Dash Camera",
        category: "technology",
        description: "In cab 'plant' device always recording when driving",
        price: 35000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Comfort Parent (Carpeted Ceiling with variations)
      {
        id: "carpeted-ceiling-parent",
        name: "Carpeted Ceiling",
        category: "comfort",
        description: "Carpeted ceiling for your van",
        price: 68500,
        images: [],
        parentId: null,
        variantName: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "carpeted-ceiling-lwb-led",
        name: "Carpeted Ceiling LWB with LED cabin lights",
        category: "comfort",
        description: "",
        price: 68500,
        images: [],
        parentId: "carpeted-ceiling-parent",
        variantName: "LWB with LED cabin lights",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "carpeted-ceiling-mwb-led",
        name: "Carpeted Ceiling MWB with LED baton lights",
        category: "comfort",
        description: "",
        price: 60000,
        images: [],
        parentId: "carpeted-ceiling-parent",
        variantName: "MWB with LED baton lights",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "hand-wash-station",
        name: "Hand Wash Station",
        category: "comfort",
        description: "Also a heated drivers seat so you can lie hows, you're warm on cold winter days",
        price: 39500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "heated-seat",
        name: "Heated Seat",
        category: "comfort",
        description: "",
        price: 55000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "rubber-flooring",
        name: "Rubber Flooring",
        category: "comfort",
        description: "Add our rubber flooring",
        price: 50000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Storage
      {
        id: "tool-chest-155pc",
        name: "155 Piece Nielsen Tool Chest",
        category: "storage",
        description: "",
        price: 65000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "empty-tool-chest",
        name: "Empty Tool Chest",
        category: "storage",
        description: "",
        price: 25000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "tyre-racking",
        name: "Tyre Racking",
        category: "storage",
        description: "(if you not required)",
        price: 49500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "wheel-balancer-cone-holder",
        name: "Wall mounted wheel balancer cone holder And Weight Piers Holder",
        category: "storage",
        description: "",
        price: 17500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "bott-wall-mounted-boxes",
        name: "BOTT Wall Mounted Valve And Weight Boxes",
        category: "storage",
        description: "",
        price: 15000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "jack-bases-2",
        name: "2 Jack Bases",
        category: "storage",
        description: "Swivs to stop your trolley jacks rolling around in the van (not boxed)",
        price: 14500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "wall-mount-gun-socket-holder",
        name: "Wall Mount Gun And Socket Holder",
        category: "storage",
        description: "Wall and sockets as shown not included",
        price: 3500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "wall-mounts-torque-wrench",
        name: "4 Wall Mounts To Hold Torque Wrench",
        category: "storage",
        description: "Will require care, torque wrench will be crack bar not boxed",
        price: 5000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Power
      {
        id: "lifepo4-battery-300ah",
        name: "300ah LiFePO4 battery upgrade and brackets",
        category: "power",
        description: "",
        price: 30000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "upgrade-batteries-lifepo4",
        name: "Upgrade Batteries To LiFePO4",
        category: "power",
        description: "Upgrade to lithium battery giving you longer battery life and capacity",
        price: 17500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "led-strips-battery-box",
        name: "LED Strips Display Battery Box",
        category: "power",
        description: "LED strips to display when voltage/current is going over 200w",
        price: 5000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Tools (Equipment category)
      {
        id: "torque-wrench",
        name: "Torque Wrench",
        category: "equipment",
        description: "up to 600nm torque wrench - Please select quantity below",
        price: 8500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "upgrade-air-jacks",
        name: "Upgrade 1/4 Tonne Jack Air Jacks",
        category: "equipment",
        description: "Upgrade your jacks to 2.5 tonners - Please select quantity below",
        price: 7500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "tyre-gauge",
        name: "Tyre Gauge",
        category: "equipment",
        description: "Please select Quantity below",
        price: 4500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "wheel-nut-sockets-3",
        name: "Set Of 3 Wheel Nut Sockets",
        category: "equipment",
        description: "Please select quantity below",
        price: 3000,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "drive-crack-bar",
        name: "1/2 Inch Drive Crack Bar",
        category: "equipment",
        description: "Please select quantity below",
        price: 3500,
        images: [],
        parentId: null,
        variantName: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const sampleFinancePlans: FinancePlan[] = [
      {
        id: "hp-3yr-595",
        name: "3 Year Hire Purchase - 5.95% APR",
        type: "HP",
        termMonths: 36,
        aprBps: 595, // 5.95% APR
        depositPercent: 10,
        balloonPercent: null,
        notes: "Standard hire purchase agreement with 10% deposit",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "hp-5yr-649",
        name: "5 Year Hire Purchase - 6.49% APR",
        type: "HP",
        termMonths: 60,
        aprBps: 649, // 6.49% APR
        depositPercent: 10,
        balloonPercent: null,
        notes: "Extended hire purchase agreement with lower monthly payments",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "lease-3yr-balloon",
        name: "3 Year Lease with Balloon Payment",
        type: "Lease",
        termMonths: 36,
        aprBps: 549, // 5.49% APR
        depositPercent: 20,
        balloonPercent: 30,
        notes: "Lease agreement with 30% balloon payment at end of term",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "hp-4yr-625",
        name: "4 Year Hire Purchase - 6.25% APR",
        type: "HP",
        termMonths: 48,
        aprBps: 625, // 6.25% APR
        depositPercent: 15,
        balloonPercent: null,
        notes: "Balanced hire purchase option with 15% deposit",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleKits.forEach(kit => this.kits.set(kit.id, kit));
    sampleVans.forEach(van => this.vans.set(van.id, van));
    sampleUpgrades.forEach(upgrade => this.upgrades.set(upgrade.id, upgrade));
    sampleFinancePlans.forEach(plan => this.financePlans.set(plan.id, plan));

    // Training Options
    const sampleTrainingOptions: TrainingOption[] = [
      {
        id: "react-training",
        name: "REACT Training",
        description: "Recovery Equipment And Carriageway Training - Legal requirement for motorway operations",
        includes: [
          "Highway Code Compliance (2 hours)",
          "Vehicle Positioning (3 hours)",
          "Risk Assessment (2 hours)",
          "Emergency Procedures (2 hours)",
          "Equipment Safety (1.5 hours)",
          "Practical Assessment (3 hours)"
        ],
        price: 49500, // £495.00 in pence
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "tyre-fitting-training",
        name: "Tyre Fitting Training",
        description: "Professional mobile tyre fitting and service expertise",
        includes: [
          "Tyre Technology & Construction (2 hours)",
          "Mobile Fitting Techniques (4 hours)",
          "Wheel Balancing (2 hours)",
          "Puncture Repair (1.5 hours)",
          "TPMS Systems (2 hours)",
          "Customer Service (1.5 hours)"
        ],
        price: 39500, // £395.00 in pence
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "complete-training-package",
        name: "Complete Training Package",
        description: "Both REACT and Tyre Fitting training - Best value for complete certification",
        includes: [
          "All REACT Training Modules",
          "All Tyre Fitting Training Modules",
          "Full Certification for both programmes",
          "Ongoing support and refresher access"
        ],
        price: 79500, // £795.00 in pence (£100 saving)
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleTrainingOptions.forEach(option => this.trainingOptions.set(option.id, option));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      isAdmin: insertUser.isAdmin ?? false,
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

  async getVansAdmin(): Promise<Van[]> {
    // Return all vans including unpublished for admin access
    return Array.from(this.vans.values());
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
    return Array.from(this.kits.values())
      .filter(kit => kit.published)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getKitsAdmin(): Promise<Kit[]> {
    return Array.from(this.kits.values())
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
      images: Array.isArray(insertUpgrade.images) ? insertUpgrade.images : [],
      parentId: insertUpgrade.parentId || null,
      variantName: insertUpgrade.variantName || null,
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
      images: Array.isArray(insertUpgrade.images) ? insertUpgrade.images : existing.images,
      parentId: insertUpgrade.parentId !== undefined ? insertUpgrade.parentId : existing.parentId,
      variantName: insertUpgrade.variantName !== undefined ? insertUpgrade.variantName : existing.variantName,
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
      financePlanId: insertQuote.financePlanId ?? null,
      financeInputs: insertQuote.financeInputs ?? null,
      notes: insertQuote.notes ?? null,
      createdAt: new Date()
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    if (!existing) return undefined;
    
    const updated: Quote = { ...existing, ...updates, id, createdAt: existing.createdAt };
    this.quotes.set(id, updated);
    return updated;
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

  // Finance Plans
  async getFinancePlans(): Promise<FinancePlan[]> {
    return Array.from(this.financePlans.values()).filter(plan => plan.published);
  }

  async getFinancePlan(id: string): Promise<FinancePlan | undefined> {
    return this.financePlans.get(id);
  }

  async createFinancePlan(insertPlan: InsertFinancePlan): Promise<FinancePlan> {
    const id = randomUUID();
    const plan: FinancePlan = { 
      ...insertPlan, 
      id,
      balloonPercent: insertPlan.balloonPercent ?? null,
      notes: insertPlan.notes ?? null,
      published: insertPlan.published ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.financePlans.set(id, plan);
    return plan;
  }

  async updateFinancePlan(id: string, insertPlan: Partial<InsertFinancePlan>): Promise<FinancePlan | undefined> {
    const existing = this.financePlans.get(id);
    if (!existing) return undefined;
    
    const updated: FinancePlan = { 
      ...existing, 
      ...insertPlan,
      balloonPercent: insertPlan.balloonPercent !== undefined ? insertPlan.balloonPercent : existing.balloonPercent,
      notes: insertPlan.notes !== undefined ? insertPlan.notes : existing.notes,
      published: insertPlan.published !== undefined ? insertPlan.published : existing.published,
      updatedAt: new Date()
    };
    this.financePlans.set(id, updated);
    return updated;
  }

  async deleteFinancePlan(id: string): Promise<boolean> {
    return this.financePlans.delete(id);
  }

  // Training Options
  async getTrainingOptions(): Promise<TrainingOption[]> {
    return Array.from(this.trainingOptions.values()).filter(option => option.published);
  }

  async getTrainingOption(id: string): Promise<TrainingOption | undefined> {
    return this.trainingOptions.get(id);
  }

  async createTrainingOption(option: InsertTrainingOption): Promise<TrainingOption> {
    const newOption: TrainingOption = {
      id: randomUUID(),
      ...option,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.trainingOptions.set(newOption.id, newOption);
    return newOption;
  }

  async updateTrainingOption(id: string, option: Partial<InsertTrainingOption>): Promise<TrainingOption | undefined> {
    const existing = this.trainingOptions.get(id);
    if (!existing) return undefined;

    const updated: TrainingOption = {
      ...existing,
      ...option,
      updatedAt: new Date()
    };
    this.trainingOptions.set(id, updated);
    return updated;
  }

  async deleteTrainingOption(id: string): Promise<boolean> {
    return this.trainingOptions.delete(id);
  }
}

// Database Storage Implementation
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  // Vans
  async getVans(filters?: { make?: string; year?: number; maxPrice?: number; minPrice?: number; transmission?: string; size?: string }): Promise<Van[]> {
    let query = db.select().from(schema.vans).where(eq(schema.vans.published, true));
    
    if (filters) {
      const conditions = [];
      if (filters.make) conditions.push(eq(schema.vans.make, filters.make));
      if (filters.year) conditions.push(eq(schema.vans.year, filters.year));
      if (filters.minPrice) conditions.push(gte(schema.vans.price, filters.minPrice));
      if (filters.maxPrice) conditions.push(lte(schema.vans.price, filters.maxPrice));
      
      if (conditions.length > 0) {
        query = db.select().from(schema.vans).where(and(eq(schema.vans.published, true), ...conditions));
      }
    }
    
    return await query;
  }

  async getVansAdmin(): Promise<Van[]> {
    return await db.select().from(schema.vans);
  }

  async getVan(id: string): Promise<Van | undefined> {
    const result = await db.select().from(schema.vans).where(eq(schema.vans.id, id));
    return result[0];
  }

  async getVanBySlug(slug: string): Promise<Van | undefined> {
    const result = await db.select().from(schema.vans).where(eq(schema.vans.slug, slug));
    return result[0];
  }

  async createVan(insertVan: InsertVan): Promise<Van> {
    // Check if slug already exists, and make it unique if needed
    let finalSlug = insertVan.slug;
    let counter = 1;
    
    while (true) {
      const existing = await db.select().from(schema.vans).where(eq(schema.vans.slug, finalSlug));
      if (existing.length === 0) break;
      
      // Add counter to make slug unique
      finalSlug = `${insertVan.slug}-${counter}`;
      counter++;
    }
    
    const result = await db.insert(schema.vans).values({ ...insertVan, slug: finalSlug }).returning();
    return result[0];
  }

  async updateVan(id: string, insertVan: Partial<InsertVan>): Promise<Van | undefined> {
    const result = await db.update(schema.vans).set(insertVan).where(eq(schema.vans.id, id)).returning();
    return result[0];
  }

  async deleteVan(id: string): Promise<boolean> {
    const result = await db.delete(schema.vans).where(eq(schema.vans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Kits
  async getKits(): Promise<Kit[]> {
    return await db.select().from(schema.kits).where(eq(schema.kits.published, true)).orderBy(asc(schema.kits.sortOrder));
  }

  async getKitsAdmin(): Promise<Kit[]> {
    return await db.select().from(schema.kits).orderBy(asc(schema.kits.sortOrder));
  }

  async getKit(id: string): Promise<Kit | undefined> {
    const result = await db.select().from(schema.kits).where(eq(schema.kits.id, id));
    return result[0];
  }

  async createKit(insertKit: InsertKit): Promise<Kit> {
    const result = await db.insert(schema.kits).values(insertKit).returning();
    return result[0];
  }

  async updateKit(id: string, insertKit: Partial<InsertKit>): Promise<Kit | undefined> {
    const result = await db.update(schema.kits).set(insertKit).where(eq(schema.kits.id, id)).returning();
    return result[0];
  }

  async deleteKit(id: string): Promise<boolean> {
    const result = await db.delete(schema.kits).where(eq(schema.kits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Upgrades
  async getUpgrades(category?: string): Promise<Upgrade[]> {
    if (category) {
      return await db.select().from(schema.upgrades).where(
        and(eq(schema.upgrades.published, true), eq(schema.upgrades.category, category))
      ).orderBy(schema.upgrades.sortOrder, schema.upgrades.name);
    }
    return await db.select().from(schema.upgrades).where(eq(schema.upgrades.published, true))
      .orderBy(schema.upgrades.sortOrder, schema.upgrades.name);
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const result = await db.select().from(schema.upgrades).where(eq(schema.upgrades.id, id));
    return result[0];
  }

  async createUpgrade(insertUpgrade: InsertUpgrade): Promise<Upgrade> {
    const result = await db.insert(schema.upgrades).values(insertUpgrade).returning();
    return result[0];
  }

  async updateUpgrade(id: string, insertUpgrade: Partial<InsertUpgrade>): Promise<Upgrade | undefined> {
    const result = await db.update(schema.upgrades).set(insertUpgrade).where(eq(schema.upgrades.id, id)).returning();
    return result[0];
  }

  async deleteUpgrade(id: string): Promise<boolean> {
    const result = await db.delete(schema.upgrades).where(eq(schema.upgrades.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(schema.quotes);
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const result = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
    return result[0];
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const result = await db.insert(schema.quotes).values(insertQuote).returning();
    return result[0];
  }

  async updateQuote(id: string, updateQuote: Partial<Quote>): Promise<Quote | undefined> {
    const result = await db.update(schema.quotes).set(updateQuote).where(eq(schema.quotes.id, id)).returning();
    return result[0];
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(schema.leads);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const result = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
    return result[0];
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const result = await db.insert(schema.leads).values(insertLead).returning();
    return result[0];
  }

  // Finance Plans
  async getFinancePlans(): Promise<FinancePlan[]> {
    return await db.select().from(schema.financePlans).where(eq(schema.financePlans.published, true));
  }

  async getFinancePlan(id: string): Promise<FinancePlan | undefined> {
    const result = await db.select().from(schema.financePlans).where(eq(schema.financePlans.id, id));
    return result[0];
  }

  async createFinancePlan(insertPlan: InsertFinancePlan): Promise<FinancePlan> {
    const result = await db.insert(schema.financePlans).values(insertPlan).returning();
    return result[0];
  }

  async updateFinancePlan(id: string, insertPlan: Partial<InsertFinancePlan>): Promise<FinancePlan | undefined> {
    const result = await db.update(schema.financePlans).set(insertPlan).where(eq(schema.financePlans.id, id)).returning();
    return result[0];
  }

  async deleteFinancePlan(id: string): Promise<boolean> {
    const result = await db.delete(schema.financePlans).where(eq(schema.financePlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Training Options
  async getTrainingOptions(): Promise<TrainingOption[]> {
    return db.select().from(schema.trainingOptions).where(eq(schema.trainingOptions.published, true));
  }

  async getTrainingOption(id: string): Promise<TrainingOption | undefined> {
    const results = await db.select().from(schema.trainingOptions).where(eq(schema.trainingOptions.id, id));
    return results[0];
  }

  async createTrainingOption(option: InsertTrainingOption): Promise<TrainingOption> {
    const results = await db.insert(schema.trainingOptions).values(option).returning();
    return results[0];
  }

  async updateTrainingOption(id: string, option: Partial<InsertTrainingOption>): Promise<TrainingOption | undefined> {
    const results = await db.update(schema.trainingOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(schema.trainingOptions.id, id))
      .returning();
    return results[0];
  }

  async deleteTrainingOption(id: string): Promise<boolean> {
    const result = await db.delete(schema.trainingOptions).where(eq(schema.trainingOptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DbStorage();
