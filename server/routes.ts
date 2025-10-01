import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { insertVanSchema, insertKitSchema, insertUpgradeSchema, insertQuoteSchema, insertLeadSchema, insertFinancePlanSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Public vans endpoints
  app.get("/api/vans", async (req, res) => {
    try {
      const filters = {
        make: req.query.make as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        transmission: req.query.transmission as string,
        size: req.query.size as string,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const vans = await storage.getVans(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(vans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vans" });
    }
  });

  app.get("/api/vans/:id", async (req, res) => {
    try {
      const van = await storage.getVan(req.params.id);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }
      res.json(van);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch van" });
    }
  });

  app.get("/api/vans/slug/:slug", async (req, res) => {
    try {
      const van = await storage.getVanBySlug(req.params.slug);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }
      res.json(van);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch van" });
    }
  });

  app.post("/api/vans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertVanSchema.parse(req.body);
      const van = await storage.createVan(validatedData);
      res.status(201).json(van);
    } catch (error) {
      res.status(400).json({ error: "Invalid van data" });
    }
  });

  // Kits endpoints - public (published only)
  app.get("/api/kits", async (req, res) => {
    try {
      const allKits = await storage.getKits();
      // Filter to only return published kits for public API
      const publishedKits = allKits.filter(kit => kit.published);
      res.json(publishedKits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kits" });
    }
  });

  app.get("/api/kits/:id", async (req, res) => {
    try {
      const kit = await storage.getKit(req.params.id);
      if (!kit || !kit.published) {
        return res.status(404).json({ error: "Kit not found" });
      }
      res.json(kit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kit" });
    }
  });

  app.post("/api/kits", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertKitSchema.parse(req.body);
      const kit = await storage.createKit(validatedData);
      res.status(201).json(kit);
    } catch (error) {
      res.status(400).json({ error: "Invalid kit data" });
    }
  });

  // Upgrades endpoints
  app.get("/api/upgrades", async (req, res) => {
    try {
      const category = req.query.category as string;
      const upgrades = await storage.getUpgrades(category);
      res.json(upgrades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upgrades" });
    }
  });

  app.get("/api/upgrades/:id", async (req, res) => {
    try {
      const upgrade = await storage.getUpgrade(req.params.id);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upgrade" });
    }
  });

  app.post("/api/upgrades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertUpgradeSchema.parse(req.body);
      const upgrade = await storage.createUpgrade(validatedData);
      res.status(201).json(upgrade);
    } catch (error) {
      res.status(400).json({ error: "Invalid upgrade data" });
    }
  });

  // Quotes endpoints (restricted to admin only for security)
  app.get("/api/quotes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
      
      // Fetch all referenced entities to recalculate prices server-side
      const selectedUpgradeIds = (validatedData.selectedUpgradeIds || []) as string[];
      const [van, kit, upgrades] = await Promise.all([
        validatedData.vanId ? storage.getVan(validatedData.vanId) : Promise.resolve(null),
        validatedData.kitId ? storage.getKit(validatedData.kitId) : Promise.resolve(null),
        selectedUpgradeIds.length > 0
          ? Promise.all(selectedUpgradeIds.map((id: string) => storage.getUpgrade(id)))
          : Promise.resolve([])
      ]);

      // Validate that all entities exist
      if (validatedData.vanId && !van) {
        return res.status(400).json({ error: "Selected van not found" });
      }
      if (validatedData.kitId && !kit) {
        return res.status(400).json({ error: "Selected kit not found" });
      }
      if (upgrades.some((u: any) => !u)) {
        return res.status(400).json({ error: "One or more selected upgrades not found" });
      }

      // Calculate server-side pricing (all prices in pence) with quantities
      const vanPrice = van?.price || 0;
      const kitPrice = kit?.price || 0;
      const upgradesTotal = upgrades.reduce((sum: number, upgrade: any) => {
        const quantity = validatedData.selectedUpgrades?.[upgrade.id] || 1;
        return sum + (upgrade?.price || 0) * quantity;
      }, 0);
      
      const subtotal = vanPrice + kitPrice + upgradesTotal;
      const vatRate = 0.20; // 20% VAT
      const vat = Math.round(subtotal * vatRate);
      const total = subtotal + vat;

      // Validate client-submitted prices match server calculation
      // Allow small tolerance for rounding differences (within 1 pence)
      const priceTolerance = 1;
      if (
        Math.abs(validatedData.estSubtotal - subtotal) > priceTolerance ||
        Math.abs(validatedData.estVAT - vat) > priceTolerance ||
        Math.abs(validatedData.estTotal - total) > priceTolerance
      ) {
        console.error('Price mismatch:', {
          submitted: { subtotal: validatedData.estSubtotal, vat: validatedData.estVAT, total: validatedData.estTotal },
          calculated: { subtotal, vat, total }
        });
        return res.status(400).json({ 
          error: "Price validation failed. Please refresh and try again.",
          details: {
            expectedSubtotal: subtotal,
            expectedVAT: vat,
            expectedTotal: total
          }
        });
      }

      // Create quote with server-validated prices and user ID if authenticated
      const quoteData = {
        ...validatedData,
        userId: req.session.user?.id || null,
        estSubtotal: subtotal,
        estVAT: vat,
        estTotal: total,
      };

      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid quote data", details: error.message });
      }
      console.error('Quote creation error:', error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  // Leads endpoints
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      res.status(400).json({ error: "Invalid lead data" });
    }
  });

  // Finance Plans endpoints - public (published only)
  app.get("/api/finance-plans", async (req, res) => {
    try {
      const plans = await storage.getFinancePlans();
      const publishedPlans = plans.filter(p => p.published);
      res.json(publishedPlans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance plans" });
    }
  });

  app.get("/api/finance-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getFinancePlan(req.params.id);
      if (!plan || !plan.published) {
        return res.status(404).json({ error: "Finance plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance plan" });
    }
  });

  // Configurator endpoints
  app.get("/api/configurator/data", async (req, res) => {
    try {
      const [kits, upgrades, financePlans] = await Promise.all([
        storage.getKits(),
        storage.getUpgrades(),
        storage.getFinancePlans()
      ]);
      
      // Group upgrades by category
      const upgradesByCategory = upgrades.reduce((acc, upgrade) => {
        if (!acc[upgrade.category]) {
          acc[upgrade.category] = [];
        }
        acc[upgrade.category].push(upgrade);
        return acc;
      }, {} as Record<string, typeof upgrades>);
      
      res.json({
        kits,
        upgrades: upgradesByCategory,
        financePlans: financePlans.filter(p => p.published)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configurator data" });
    }
  });

  app.post("/api/configurator/calculate", async (req, res) => {
    try {
      // Validate request body
      const bodySchema = z.object({
        vanId: z.string().optional(),
        kitId: z.string().optional(),
        upgradeIds: z.array(z.string()).default([]),
        upgradeQuantities: z.record(z.number()).default({})
      });
      
      const { vanId, kitId, upgradeIds, upgradeQuantities } = bodySchema.parse(req.body);
      
      let subtotal = 0;
      
      // Add van price if selected
      if (vanId) {
        const van = await storage.getVan(vanId);
        if (van) {
          subtotal += van.price;
        }
      }
      
      // Add kit price
      if (kitId) {
        const kit = await storage.getKit(kitId);
        if (kit) {
          subtotal += kit.price;
        }
      }
      
      // Add upgrade prices (with quantities)
      for (const upgradeId of upgradeIds) {
        const upgrade = await storage.getUpgrade(upgradeId);
        if (upgrade) {
          const quantity = upgradeQuantities[upgradeId] || 1;
          subtotal += upgrade.price * quantity;
        }
      }
      
      const vat = Math.round(subtotal * 0.2); // 20% VAT
      const total = subtotal + vat;
      
      res.json({
        subtotal,
        vat,
        total,
        vatRate: 0.2
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate price" });
    }
  });

  // Admin CRUD endpoints for vans
  app.post("/api/admin/vans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const vanData = insertVanSchema.parse(req.body);
      const van = await storage.createVan(vanData);
      res.json(van);
    } catch (error) {
      res.status(400).json({ error: "Failed to create van" });
    }
  });

  app.put("/api/admin/vans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const vanData = insertVanSchema.partial().parse(req.body);
      const van = await storage.updateVan(req.params.id, vanData);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }
      res.json(van);
    } catch (error) {
      res.status(400).json({ error: "Failed to update van" });
    }
  });

  app.delete("/api/admin/vans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteVan(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Van not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete van" });
    }
  });

  // Admin CRUD endpoints for kits
  app.get("/api/admin/kits", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const kits = await storage.getKits();
      res.json(kits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kits" });
    }
  });

  app.post("/api/admin/kits", isAuthenticated, isAdmin, async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🛠️ Kit creation request:', {
          body: req.body,
          userId: req.session.user?.id
        });
      }
      
      const kitData = insertKitSchema.parse(req.body);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Kit validation passed:', kitData);
      }
      
      const kit = await storage.createKit(kitData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Kit created:', kit);
      }
      
      res.json(kit);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Kit creation failed:', error);
      }
      res.status(400).json({ error: "Failed to create kit" });
    }
  });

  app.put("/api/admin/kits/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const kitData = insertKitSchema.partial().parse(req.body);
      const kit = await storage.updateKit(req.params.id, kitData);
      if (!kit) {
        return res.status(404).json({ error: "Kit not found" });
      }
      res.json(kit);
    } catch (error) {
      res.status(400).json({ error: "Failed to update kit" });
    }
  });

  app.delete("/api/admin/kits/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteKit(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Kit not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete kit" });
    }
  });

  // Admin CRUD endpoints for upgrades
  app.get("/api/admin/upgrades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const upgrades = await storage.getUpgrades();
      res.json(upgrades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upgrades" });
    }
  });

  app.post("/api/admin/upgrades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const upgradeData = insertUpgradeSchema.parse(req.body);
      const upgrade = await storage.createUpgrade(upgradeData);
      res.json(upgrade);
    } catch (error) {
      res.status(400).json({ error: "Failed to create upgrade" });
    }
  });

  app.put("/api/admin/upgrades/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const upgradeData = insertUpgradeSchema.partial().parse(req.body);
      const upgrade = await storage.updateUpgrade(req.params.id, upgradeData);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      res.status(400).json({ error: "Failed to update upgrade" });
    }
  });

  app.delete("/api/admin/upgrades/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Check if this upgrade has child variations
      const allUpgrades = await storage.getUpgrades();
      const hasChildren = allUpgrades.some(u => u.parentId === req.params.id);
      
      if (hasChildren) {
        return res.status(400).json({ 
          error: "Cannot delete equipment that has variations. Delete variations first." 
        });
      }
      
      const success = await storage.deleteUpgrade(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete upgrade" });
    }
  });

  // Admin CRUD endpoints for finance plans
  app.get("/api/admin/finance-plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = await storage.getFinancePlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance plans" });
    }
  });

  app.post("/api/admin/finance-plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planData = insertFinancePlanSchema.parse(req.body);
      const plan = await storage.createFinancePlan(planData);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Failed to create finance plan" });
    }
  });

  app.put("/api/admin/finance-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planData = insertFinancePlanSchema.partial().parse(req.body);
      const plan = await storage.updateFinancePlan(req.params.id, planData);
      if (!plan) {
        return res.status(404).json({ error: "Finance plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Failed to update finance plan" });
    }
  });

  app.delete("/api/admin/finance-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteFinancePlan(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Finance plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete finance plan" });
    }
  });

  // Customer portal endpoints
  app.get("/api/portal/quotes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user?.id;
      const allQuotes = await storage.getQuotes();
      const userQuotes = allQuotes.filter(quote => quote.userId === userId);
      res.json(userQuotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your quotes" });
    }
  });

  app.get("/api/portal/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user?.id;
      const quote = await storage.getQuote(req.params.id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Verify the quote belongs to the logged-in user
      if (quote.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  // Admin user management endpoints - commented out for now
  // Admin user is created automatically on startup

  // Admin endpoints for viewing quotes and leads
  app.get("/api/admin/quotes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/admin/leads", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
