import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { 
  insertVanSchema, 
  insertKitSchema, 
  insertUpgradeSchema, 
  insertQuoteSchema, 
  insertLeadSchema, 
  insertFinancePlanSchema,
  insertTrainingOptionSchema,
  quoteStatuses,
  financeStatuses,
  buildStages
} from "@shared/schema";

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

  // Quotes endpoints
  // Public endpoint for completed builds showcase (must come before :id route)
  app.get("/api/quotes/completed", async (req, res) => {
    try {
      const allQuotes = await storage.getQuotes();
      const completedQuotes = allQuotes.filter(q => q.status === "completed");
      res.json(completedQuotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completed builds" });
    }
  });

  // Admin only - list all quotes
  app.get("/api/quotes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Secure quotes detail endpoint - admin only (must come after /completed route)
  app.get("/api/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  // Training Options endpoints - public (published only)
  app.get("/api/training-options", async (req, res) => {
    try {
      const options = await storage.getTrainingOptions();
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training options" });
    }
  });

  app.get("/api/training-options/:id", async (req, res) => {
    try {
      const option = await storage.getTrainingOption(req.params.id);
      if (!option || !option.published) {
        return res.status(404).json({ error: "Training option not found" });
      }
      res.json(option);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training option" });
    }
  });

  // Configurator endpoints
  app.get("/api/configurator/data", async (req, res) => {
    try {
      const [kits, upgrades, financePlans, trainingOptions] = await Promise.all([
        storage.getKits(),
        storage.getUpgrades(),
        storage.getFinancePlans(),
        storage.getTrainingOptions()
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
        financePlans: financePlans.filter(p => p.published),
        trainingOptions: trainingOptions.filter(o => o.published)
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
        upgradeQuantities: z.record(z.number()).default({}),
        trainingOptionIds: z.array(z.string()).default([])
      });
      
      const { vanId, kitId, upgradeIds, upgradeQuantities, trainingOptionIds } = bodySchema.parse(req.body);
      
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
      
      // Add training option prices
      for (const trainingOptionId of trainingOptionIds) {
        const trainingOption = await storage.getTrainingOption(trainingOptionId);
        if (trainingOption) {
          subtotal += trainingOption.price;
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
  app.get("/api/admin/vans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const vans = await storage.getVansAdmin();
      res.json(vans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vans" });
    }
  });

  app.post("/api/admin/vans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const vanData = insertVanSchema.parse(req.body);
      const van = await storage.createVan(vanData);
      res.json(van);
    } catch (error) {
      console.error("Van creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
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

  // Fix ACLs for all van images
  app.post("/api/admin/vans/fix-acls", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const vans = await storage.getVans();
      let fixedCount = 0;
      const objectStorageService = new ObjectStorageService();

      for (const van of vans) {
        const imagesToFix: string[] = [];
        
        if (van.heroImage) {
          imagesToFix.push(van.heroImage);
        }
        if (van.images && Array.isArray(van.images)) {
          imagesToFix.push(...van.images);
        }

        // Remove duplicates
        const uniqueImages = Array.from(new Set(imagesToFix));

        for (const imageUrl of uniqueImages) {
          if (imageUrl && imageUrl.includes('googleapis.com')) {
            try {
              await objectStorageService.trySetObjectEntityAclPolicy(imageUrl, {
                owner: 'system',
                visibility: 'public'
              });
              fixedCount++;
            } catch (error) {
              console.error(`Failed to set ACL for ${imageUrl}:`, error);
            }
          }
        }
      }

      res.json({ success: true, fixedCount, message: `Fixed ACLs for ${fixedCount} images` });
    } catch (error) {
      console.error("Error fixing van image ACLs:", error);
      res.status(500).json({ error: "Failed to fix van image ACLs" });
    }
  });

  // Add image to van - NEW SIMPLIFIED VERSION
  app.post("/api/admin/vans/:id/images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      // Validate URL format
      if (!imageUrl.startsWith('https://storage.googleapis.com/')) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }

      const van = await storage.getVan(req.params.id);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }

      // Add image URL to van images array
      const existingImages = van.images || [];
      const updatedImages = [...existingImages, imageUrl];
      
      const updatedVan = await storage.updateVan(req.params.id, {
        images: updatedImages,
        // If no hero image is set, use the first uploaded image
        ...((!van.heroImage && existingImages.length === 0) ? { heroImage: imageUrl } : {})
      });

      res.json(updatedVan);
    } catch (error) {
      console.error("Error adding van image:", error);
      res.status(500).json({ error: "Failed to add van image" });
    }
  });

  // Remove image from van
  app.delete("/api/admin/vans/:id/images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      const van = await storage.getVan(req.params.id);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }

      const existingImages = van.images || [];
      const updatedImages = existingImages.filter(img => img !== objectPath);
      
      // If removing the hero image, clear it or set to first remaining image
      const updatedHeroImage = van.heroImage === objectPath
        ? (updatedImages.length > 0 ? updatedImages[0] : undefined)
        : van.heroImage;
      
      const updatedVan = await storage.updateVan(req.params.id, {
        images: updatedImages,
        heroImage: updatedHeroImage
      });

      res.json(updatedVan);
    } catch (error) {
      console.error("Error removing van image:", error);
      res.status(500).json({ error: "Failed to remove van image" });
    }
  });

  // Set van hero image
  app.put("/api/admin/vans/:id/hero-image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      const van = await storage.getVan(req.params.id);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }

      // Verify the image is in the van's images array
      const existingImages = van.images || [];
      if (!existingImages.includes(objectPath)) {
        return res.status(400).json({ error: "Image not found in van's image gallery" });
      }
      
      const updatedVan = await storage.updateVan(req.params.id, {
        heroImage: objectPath
      });

      res.json(updatedVan);
    } catch (error) {
      console.error("Error setting hero image:", error);
      res.status(500).json({ error: "Failed to set hero image" });
    }
  });

  // Reorder van images
  app.put("/api/admin/vans/:id/images/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { images } = req.body;
      
      if (!Array.isArray(images)) {
        return res.status(400).json({ error: "images array is required" });
      }

      const van = await storage.getVan(req.params.id);
      if (!van) {
        return res.status(404).json({ error: "Van not found" });
      }

      // Verify all images in the new order are from the van's existing images
      const existingImages = van.images || [];
      const allValid = images.every(img => existingImages.includes(img));
      
      if (!allValid || images.length !== existingImages.length) {
        return res.status(400).json({ error: "Invalid image order - images don't match van's gallery" });
      }
      
      const updatedVan = await storage.updateVan(req.params.id, {
        images: images
      });

      res.json(updatedVan);
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ error: "Failed to reorder images" });
    }
  });

  // Vehicle Registration Lookup (using CheckCarDetails API)
  app.post("/api/admin/vehicle-lookup", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { registration } = req.body;

      if (!registration) {
        return res.status(400).json({ error: "Registration number is required" });
      }

      const apiKey = process.env.AUTOTRADER_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured in secrets" });
      }

      // Clean registration (remove spaces, uppercase)
      const cleanReg = registration.replace(/\s+/g, '').toUpperCase();
      console.log('Looking up registration:', cleanReg);

      // Call 3 CheckCarDetails endpoints in parallel
      const endpoints = [
        {
          name: 'vehicleregistration',
          url: `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration?apikey=${apiKey}&vrm=${cleanReg}`
        },
        {
          name: 'vehiclespecs',
          url: `https://api.checkcardetails.co.uk/vehicledata/vehiclespecs?apikey=${apiKey}&vrm=${cleanReg}`
        },
        {
          name: 'mot',
          url: `https://api.checkcardetails.co.uk/vehicledata/mot?apikey=${apiKey}&vrm=${cleanReg}`
        }
      ];

      const responses = await Promise.allSettled(
        endpoints.map(async endpoint => {
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'MTVC-API/1.0',
              'Accept': '*/*'
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return { endpoint: endpoint.name, data, status: response.status };
          }
          throw new Error(`${endpoint.name} failed: ${response.status}`);
        })
      );

      // Extract successful responses
      const regData = responses[0].status === 'fulfilled' ? responses[0].value?.data : null;
      const specsData = responses[1].status === 'fulfilled' ? responses[1].value?.data : null;
      const motData = responses[2].status === 'fulfilled' ? responses[2].value?.data : null;

      console.log('Raw API responses:');
      console.log('Registration data:', JSON.stringify(regData, null, 2));
      console.log('Specs data:', JSON.stringify(specsData, null, 2));
      console.log('MOT data:', JSON.stringify(motData, null, 2));

      if (!regData) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      // Determine van size from body type
      const bodyType = specsData?.BodyDetails?.WheelBaseType || specsData?.BodyDetails?.BodyStyle || '';
      let vanSize = 'MWB';
      if (bodyType.toLowerCase().includes('short')) vanSize = 'SWB';
      else if (bodyType.toLowerCase().includes('long')) vanSize = 'LWB';
      else if (bodyType.toLowerCase().includes('medium')) vanSize = 'MWB';

      // Transform API response to our van format
      const vanData = {
        registration: cleanReg,
        make: regData.make || '',
        model: regData.model || '',
        year: parseInt(regData.yearOfManufacture) || new Date().getFullYear(),
        specs: {
          transmission: specsData?.Transmission?.TransmissionType || 'Manual',
          fuel: regData.fuelType || 'Diesel',
          size: vanSize,
          doors: specsData?.BodyDetails?.NumberOfDoors || specsData?.DvlaTechnicalDetails?.SeatCountIncludingDriver || undefined,
          engine: regData.engineCapacity ? `${(regData.engineCapacity / 1000).toFixed(1)}L` : '',
        },
        // Suggest title
        title: `${regData.yearOfManufacture} ${regData.make} ${regData.model}`,
      };

      console.log('Vehicle lookup success - returning data:', JSON.stringify(vanData, null, 2));
      res.json(vanData);
    } catch (error) {
      console.error("Error looking up vehicle:", error);
      res.status(500).json({ error: "Failed to lookup vehicle" });
    }
  });

  // Wirral Vans Integration
  app.post("/api/admin/wirral-vans/test-connection", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const wirralVansApiUrl = process.env.WIRRAL_VANS_API_URL;
      const apiKey = process.env.WIRRAL_VANS_API_KEY;

      if (!wirralVansApiUrl) {
        return res.status(400).json({ error: "WIRRAL_VANS_API_URL not configured" });
      }

      const response = await fetch(`${wirralVansApiUrl}/api/public/vans`, {
        headers: {
          'Authorization': `Bearer ${apiKey || ''}`
        }
      });

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to connect to Wirral Vans API" });
      }

      res.json({ success: true, message: "Connection successful" });
    } catch (error) {
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  app.get("/api/admin/wirral-vans/available", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const wirralVansApiUrl = process.env.WIRRAL_VANS_API_URL;
      const apiKey = process.env.WIRRAL_VANS_API_KEY;

      if (!wirralVansApiUrl) {
        return res.status(400).json({ error: "WIRRAL_VANS_API_URL not configured" });
      }

      const response = await fetch(`${wirralVansApiUrl}/api/public/vans?exportable=true`, {
        headers: {
          'Authorization': `Bearer ${apiKey || ''}`
        }
      });

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to fetch vans from Wirral Vans" });
      }

      const vans = await response.json();
      res.json(vans);
    } catch (error) {
      console.error("Error fetching Wirral Vans:", error);
      res.status(500).json({ error: "Failed to fetch vans" });
    }
  });

  app.post("/api/admin/wirral-vans/import", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { vanIds } = req.body;

      if (!Array.isArray(vanIds) || vanIds.length === 0) {
        return res.status(400).json({ error: "vanIds array is required" });
      }

      const wirralVansApiUrl = process.env.WIRRAL_VANS_API_URL;
      const apiKey = process.env.WIRRAL_VANS_API_KEY;

      if (!wirralVansApiUrl) {
        return res.status(400).json({ error: "WIRRAL_VANS_API_URL not configured" });
      }

      let imported = 0;
      const errors = [];

      for (const vanId of vanIds) {
        try {
          const response = await fetch(`${wirralVansApiUrl}/api/public/vans/${vanId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey || ''}`
            }
          });

          if (!response.ok) {
            errors.push(`Failed to fetch van ${vanId}`);
            continue;
          }

          const wirralVan = await response.json();

          // Create van in local database
          const vanData = {
            slug: wirralVan.slug || `${wirralVan.make}-${wirralVan.model}-${wirralVan.year}`.toLowerCase().replace(/\s+/g, '-'),
            title: wirralVan.title,
            make: wirralVan.make,
            model: wirralVan.model,
            year: wirralVan.year,
            mileage: wirralVan.mileage,
            price: wirralVan.price,
            vatIncluded: wirralVan.vatIncluded || false,
            specs: wirralVan.specs,
            images: wirralVan.images || [],
            heroImage: wirralVan.heroImage,
            published: false // Import as unpublished by default
          };

          await storage.createVan(vanData);
          imported++;
        } catch (error) {
          errors.push(`Failed to import van ${vanId}`);
        }
      }

      res.json({ 
        imported, 
        total: vanIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error importing vans:", error);
      res.status(500).json({ error: "Failed to import vans" });
    }
  });

  // Webhook endpoint for receiving pushed vehicles from Wirral Vans
  app.post("/api/webhooks/wirral-vans/push-vehicle", async (req, res) => {
    try {
      // Validate API key
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      const validApiKey = process.env.WIRRAL_VANS_API_KEY;

      if (!validApiKey) {
        return res.status(500).json({ error: "Webhook not configured" });
      }

      if (apiKey !== validApiKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Parse and validate vehicle data
      const vehicleData = req.body;

      // Create the van data object matching our schema
      const vanData = {
        slug: vehicleData.slug || `${vehicleData.make}-${vehicleData.model}-${vehicleData.year}`.toLowerCase().replace(/\s+/g, '-'),
        title: vehicleData.title,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        mileage: vehicleData.mileage,
        price: vehicleData.price,
        vatIncluded: vehicleData.vatIncluded || false,
        specs: vehicleData.specs,
        images: vehicleData.images || [],
        heroImage: vehicleData.heroImage,
        published: false // Start as unpublished for review
      };

      // Validate with schema
      const validatedData = insertVanSchema.parse(vanData);

      // Check for duplicate slug
      const existingVan = await storage.getVans();
      const duplicate = existingVan.find(v => v.slug === validatedData.slug);
      
      if (duplicate) {
        return res.status(409).json({ 
          error: "Duplicate vehicle", 
          message: "A vehicle with this slug already exists",
          existingVanId: duplicate.id
        });
      }

      // Create the van
      const createdVan = await storage.createVan(validatedData);

      console.log(`✅ Vehicle pushed from Wirral Vans: ${createdVan.title} (${createdVan.id})`);

      res.json({ 
        success: true, 
        vanId: createdVan.id,
        message: "Vehicle successfully added to inventory"
      });
    } catch (error) {
      console.error("Error processing pushed vehicle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid vehicle data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to process vehicle" });
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
      
      // Validate pricing: parent upgrades (no parentId) must have price > 0 OR have children
      if (!upgradeData.parentId && upgradeData.price === 0) {
        // Check if this will have variant children by checking if it's referenced as a parent
        // For creation, we can't check existing children, so we must enforce price > 0
        // OR this validation happens after variants are created
        // For now, we'll allow 0 price only if this is explicitly a variant parent
        // The frontend should handle this, but we add a warning
        console.warn(`Creating upgrade ${upgradeData.name} with price 0 - assuming it will have variants`);
      }
      
      // Validate variant children must have price > 0
      if (upgradeData.parentId && upgradeData.price <= 0) {
        return res.status(400).json({ 
          error: "Variant upgrades must have a price greater than 0" 
        });
      }
      
      const upgrade = await storage.createUpgrade(upgradeData);
      res.json(upgrade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid upgrade data", details: error.errors });
      }
      res.status(400).json({ error: "Failed to create upgrade" });
    }
  });

  app.put("/api/admin/upgrades/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const upgradeData = insertUpgradeSchema.partial().parse(req.body);
      
      // Validate variant children must have price > 0 if price is being updated
      if (upgradeData.parentId && upgradeData.price !== undefined && upgradeData.price <= 0) {
        return res.status(400).json({ 
          error: "Variant upgrades must have a price greater than 0" 
        });
      }
      
      const upgrade = await storage.updateUpgrade(req.params.id, upgradeData);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid upgrade data", details: error.errors });
      }
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

  // Update upgrade sort order
  app.patch("/api/admin/upgrades/:id/sort-order", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sortOrder } = req.body;
      
      if (typeof sortOrder !== 'number') {
        return res.status(400).json({ error: "sortOrder must be a number" });
      }
      
      const upgrade = await storage.updateUpgrade(req.params.id, { sortOrder });
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sort order" });
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

  // Admin CRUD endpoints for training options
  app.get("/api/admin/training-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const options = await storage.getTrainingOptions();
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training options" });
    }
  });

  app.post("/api/admin/training-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const optionData = insertTrainingOptionSchema.parse(req.body);
      const option = await storage.createTrainingOption(optionData);
      res.json(option);
    } catch (error) {
      res.status(400).json({ error: "Failed to create training option" });
    }
  });

  app.put("/api/admin/training-options/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const optionData = insertTrainingOptionSchema.partial().parse(req.body);
      const option = await storage.updateTrainingOption(req.params.id, optionData);
      if (!option) {
        return res.status(404).json({ error: "Training option not found" });
      }
      res.json(option);
    } catch (error) {
      res.status(400).json({ error: "Failed to update training option" });
    }
  });

  app.delete("/api/admin/training-options/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTrainingOption(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Training option not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete training option" });
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

  app.post("/api/portal/quotes/:id/approve-artwork", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user?.id;
      const { approved, notes } = req.body;
      
      const quote = await storage.getQuote(req.params.id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Verify the quote belongs to the logged-in user
      if (quote.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update artwork approval status
      const updated = await storage.updateQuote(req.params.id, {
        graphicsArtworkApproved: approved,
        graphicsArtworkNotes: notes || quote.graphicsArtworkNotes,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update artwork approval" });
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

  app.get("/api/admin/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  // Alias for consistency - both paths work
  app.get("/api/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch("/api/admin/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Validate and whitelist allowed fields for admin updates
      const allowedUpdates = z.object({
        status: z.enum(quoteStatuses).optional(),
        financeStatus: z.enum(financeStatuses).optional(),
        buildStage: z.enum(buildStages).nullable().optional(),
        graphicsArtworkUrl: z.string().url().or(z.literal('')).nullable().optional(),
        graphicsArtworkNotes: z.string().nullable().optional(),
      });

      const validatedData = allowedUpdates.parse(req.body);
      const updated = await storage.updateQuote(req.params.id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update quote" });
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

  // Analytics endpoint
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [quotes, leads, vans] = await Promise.all([
        storage.getQuotes(),
        storage.getLeads(),
        storage.getVans()
      ]);

      // Calculate metrics
      const totalQuotes = quotes.length;
      const totalLeads = leads.length;
      const totalVans = vans.length;
      const publishedVans = vans.filter(v => v.published).length;

      // Quote status breakdown
      const quotesByStatus = quotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentQuotes = quotes.filter(q => 
        q.createdAt && new Date(q.createdAt) > sevenDaysAgo
      ).length;
      
      const recentLeads = leads.filter(l => 
        l.createdAt && new Date(l.createdAt) > sevenDaysAgo
      ).length;

      // Most popular vans (by quote selections)
      const vanPopularity = quotes.reduce((acc, quote) => {
        if (quote.vanId) {
          acc[quote.vanId] = (acc[quote.vanId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const popularVans = Object.entries(vanPopularity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([vanId, count]) => {
          const van = vans.find(v => v.id === vanId);
          return {
            vanId,
            title: van?.title || 'Unknown',
            count
          };
        });

      // Most popular kits
      const kitPopularity = quotes.reduce((acc, quote) => {
        if (quote.kitId) {
          acc[quote.kitId] = (acc[quote.kitId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const popularKits = Object.entries(kitPopularity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([kitId, count]) => ({
          kitId,
          count
        }));

      res.json({
        overview: {
          totalQuotes,
          totalLeads,
          totalVans,
          publishedVans,
          recentQuotes,
          recentLeads
        },
        quotesByStatus,
        popularVans,
        popularKits,
        recentActivity: {
          quotes: quotes
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5)
            .map(q => ({
              id: q.id,
              customerName: q.userName,
              customerEmail: q.email,
              status: q.status,
              totalPrice: q.estTotal,
              createdAt: q.createdAt
            })),
          leads: leads
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5)
            .map(l => ({
              id: l.id,
              name: l.name,
              email: l.email,
              message: l.message,
              createdAt: l.createdAt
            }))
        }
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Referenced from blueprint: javascript_object_storage - protected file uploading
  // The endpoint for serving objects with ACL checks (public and private)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    // Get userId if user is authenticated (undefined for public access)
    const userId = (req as any).user?.id;
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const { ObjectPermission } = await import("./objectAcl");
    const objectStorageService = new ObjectStorageService();
    try {
      console.log('🖼️ Image request:', req.path);
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      console.log('✅ File found, checking access...');
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      console.log('🔐 Access check result:', canAccess);
      if (!canAccess) {
        console.log('❌ Access denied for:', req.path);
        return res.sendStatus(401);
      }
      console.log('✅ Serving image:', req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        console.log('❌ Image not found:', req.path);
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // The endpoint for getting the upload URL for an object entity
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!contentType || !allowedTypes.includes(contentType.toLowerCase())) {
        return res.status(400).json({ error: "Only images are allowed (PNG, JPEG, SVG)" });
      }
      
      // Validate filename
      if (!filename || filename.trim() === '') {
        return res.status(400).json({ error: "Filename is required" });
      }
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(filename);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Admin endpoint for temporary image upload (for create forms)
  app.post("/api/admin/temp-upload", isAuthenticated, isAdmin, async (req, res) => {
    const multer = await import("multer");
    const upload = multer.default({ storage: multer.memoryStorage() });
    
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload failed" });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype.toLowerCase())) {
          return res.status(400).json({ error: "Only images are allowed" });
        }

        // Upload to object storage
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const url = await objectStorageService.uploadFileToPublicStorage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        res.json({ url });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    });
  });

  // Admin endpoint for van image upload - BACKEND PROXY (no CORS issues)
  app.post("/api/admin/vans/:id/upload-image", isAuthenticated, isAdmin, async (req, res) => {
    const multer = await import("multer");
    const upload = multer.default({ storage: multer.memoryStorage() });
    
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload failed" });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype.toLowerCase())) {
          return res.status(400).json({ error: "Only images are allowed" });
        }

        // Verify van exists
        const van = await storage.getVan(req.params.id);
        if (!van) {
          return res.status(404).json({ error: "Van not found" });
        }
        
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        
        // Upload file to public storage
        const publicURL = await objectStorageService.uploadFileToPublicStorage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        
        // Save to van record
        const existingImages = van.images || [];
        const updatedImages = [...existingImages, publicURL];
        
        const updatedVan = await storage.updateVan(req.params.id, {
          images: updatedImages,
          // If no hero image is set, use the first uploaded image
          ...((!van.heroImage && existingImages.length === 0) ? { heroImage: publicURL } : {})
        });

        res.json({ publicURL, van: updatedVan });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ error: "Failed to upload image" });
      }
    });
  });

  // Admin endpoint for setting ACL policy on uploaded objects
  app.post("/api/admin/objects/set-acl", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectPath, acl } = req.body;
      
      if (!objectPath || typeof objectPath !== 'string') {
        return res.status(400).json({ error: "Object path is required" });
      }
      
      if (!acl || !['public', 'private'].includes(acl)) {
        return res.status(400).json({ error: "ACL must be 'public' or 'private'" });
      }
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const aclPolicy = {
        owner: (req as any).user?.id || "",
        visibility: acl as 'public' | 'private',
      };
      
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);
      res.json({ objectPath: normalizedPath });
    } catch (error) {
      console.error("Error setting ACL:", error);
      res.status(500).json({ error: "Failed to set ACL policy" });
    }
  });

  // Update quote with customer logos after upload
  app.put("/api/quotes/:id/logos", isAuthenticated, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      if (!objectPath || typeof objectPath !== 'string') {
        return res.status(400).json({ error: "objectPath is required" });
      }

      // Validate objectPath format
      if (!objectPath.startsWith('/objects/uploads/')) {
        return res.status(400).json({ error: "Invalid objectPath format" });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const quote = await storage.getQuote(req.params.id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Check ownership
      if (quote.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this quote" });
      }

      // Check max logos limit (5)
      const existingLogos = quote.customerLogoUrls || [];
      if (existingLogos.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 logos allowed per quote" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Get the file entity to verify it exists and check metadata
      let objectFile;
      try {
        objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      } catch (error) {
        return res.status(404).json({ error: "File not found. Upload may have failed." });
      }
      
      // Verify file metadata (size and content type)
      const [metadata] = await objectFile.getMetadata();
      const contentType = metadata.contentType || '';
      const fileSize = metadata.size || 0;
      
      // Validate content type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(contentType.toLowerCase())) {
        // Delete the invalid file
        await objectFile.delete();
        return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
      }
      
      // Validate file size (10MB max)
      if (Number(fileSize) > 10485760) {
        // Delete the oversized file
        await objectFile.delete();
        return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      }
      
      // Check for existing ACL policy
      const { getObjectAclPolicy, setObjectAclPolicy } = await import("./objectAcl");
      const existingAcl = await getObjectAclPolicy(objectFile);
      
      if (existingAcl && existingAcl.owner && existingAcl.owner !== userId.toString()) {
        // File already has an ACL with a different owner - this is a security violation
        return res.status(403).json({ error: "Cannot modify file owned by another user" });
      }
      
      // Set ACL policy for the uploaded logo (public visibility so admin can view it)
      if (!existingAcl) {
        await setObjectAclPolicy(objectFile, {
          owner: userId.toString(),
          visibility: "public", // Public so admin can view uploaded logos
        });
      }

      // Add the new logo to the customerLogoUrls array
      const updatedLogos = [...existingLogos, objectPath];
      
      const updated = await storage.updateQuote(req.params.id, {
        customerLogoUrls: updatedLogos,
      });

      res.status(200).json({
        objectPath: objectPath,
        quote: updated,
      });
    } catch (error) {
      console.error("Error adding customer logo:", error);
      res.status(500).json({ error: "Failed to add logo" });
    }
  });

  // Delete a customer logo from a quote
  app.delete("/api/quotes/:id/logos", isAuthenticated, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      if (!objectPath || typeof objectPath !== 'string') {
        return res.status(400).json({ error: "objectPath is required" });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const quote = await storage.getQuote(req.params.id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Check ownership
      if (quote.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this quote" });
      }

      const existingLogos = quote.customerLogoUrls || [];
      const updatedLogos = existingLogos.filter(logo => logo !== objectPath);
      
      // If no logo was removed, return error
      if (updatedLogos.length === existingLogos.length) {
        return res.status(404).json({ error: "Logo not found in quote" });
      }

      const updated = await storage.updateQuote(req.params.id, {
        customerLogoUrls: updatedLogos,
      });

      res.status(200).json({
        quote: updated,
      });
    } catch (error) {
      console.error("Error deleting customer logo:", error);
      res.status(500).json({ error: "Failed to delete logo" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
