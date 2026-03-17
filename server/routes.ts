import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isBasicAdmin, isFullAdmin } from "./auth";
import { buildVanMeta } from "./seo";
import { 
  insertVanSchema, 
  insertKitSchema, 
  insertUpgradeSchema, 
  insertQuoteSchema, 
  insertLeadSchema, 
  insertFinancePlanSchema,
  insertTrainingOptionSchema,
  insertGalleryItemSchema,
  createUserSchema,
  updateUserRoleSchema,
  quoteStatuses,
  financeStatuses,
  buildStages,
  type User
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Storage configuration endpoint - returns bucket name for frontend image URLs
  app.get("/api/storage/config", async (req, res) => {
    try {
      // Extract bucket name from environment variables
      const privateDir = process.env.PRIVATE_OBJECT_DIR || '';
      const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
      
      // Parse bucket name from either variable (format: /bucket-name/path)
      let bucketName = '';
      if (privateDir) {
        const match = privateDir.match(/^\/([^\/]+)\//);
        bucketName = match ? match[1] : '';
      } else if (publicPaths) {
        const match = publicPaths.match(/^\/([^\/]+)\//);
        bucketName = match ? match[1] : '';
      }
      
      res.json({ bucketName });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch storage config" });
    }
  });

  // User management endpoints (for full admins only)
  app.get("/api/admin/users", isAuthenticated, isFullAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password hashes from response
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, isFullAdmin, async (req, res) => {
    try {
      const result = createUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }

      const { username, email, firstName, lastName, adminRole } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate a random secure placeholder password (user will set their own)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // Generate a set-password token (valid for 24 hours)
      const setPasswordToken = crypto.randomBytes(32).toString('hex');
      const setPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create user with role and token
      const newUser = await storage.createUser({
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        adminRole: adminRole || "none",
        isAdmin: adminRole === "full",
        profileImageUrl: null,
        passwordResetToken: setPasswordToken,
        passwordResetExpiry: setPasswordExpiry,
      });

      const { passwordHash: _, ...safeUser } = newUser;

      // Send set-password invitation email (non-blocking)
      try {
        const { sendNewUserSetPasswordEmail } = await import('./email.js');
        const setPasswordUrl = `${req.protocol}://${req.get('host')}/reset-password/${setPasswordToken}`;
        await sendNewUserSetPasswordEmail({
          toEmail: email,
          firstName: firstName || null,
          username,
          setPasswordUrl,
        });
      } catch (emailErr) {
        console.error('Failed to send set-password email:', emailErr);
      }

      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, isFullAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent users from changing their own role
      if (req.session.user?.id === id) {
        return res.status(403).json({ message: "You cannot change your own admin role" });
      }
      
      const result = updateUserRoleSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid role data", errors: result.error.errors });
      }

      const { adminRole } = result.data;
      
      // Update user role and also update isAdmin flag (only full admins get isAdmin=true)
      const updatedUser = await storage.updateUser(id, { 
        adminRole,
        isAdmin: adminRole === "full"
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isFullAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent users from deleting themselves
      if (req.session.user?.id === id) {
        return res.status(403).json({ message: "You cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

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

  app.post("/api/vans", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.post("/api/kits", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.post("/api/upgrades", isAuthenticated, isBasicAdmin, async (req, res) => {
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
      const completedQuotes = allQuotes.filter(q => q.status === "completed" && q.featuredInPortfolio === true);
      res.json(completedQuotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completed builds" });
    }
  });

  // Admin only - list all quotes (basic admins can view)
  app.get("/api/quotes", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Secure quotes detail endpoint - admin only (basic admins can view)
  app.get("/api/quotes/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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
      const selectedTrainingOptionIds = (validatedData.trainingOptionIds || []) as string[];
      const [van, kit, upgrades, trainingOptions] = await Promise.all([
        validatedData.vanId ? storage.getVan(validatedData.vanId) : Promise.resolve(null),
        validatedData.kitId ? storage.getKit(validatedData.kitId) : Promise.resolve(null),
        selectedUpgradeIds.length > 0
          ? Promise.all(selectedUpgradeIds.map((id: string) => storage.getUpgrade(id)))
          : Promise.resolve([]),
        selectedTrainingOptionIds.length > 0
          ? Promise.all(selectedTrainingOptionIds.map((id: string) => storage.getTrainingOption(id)))
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
      if (trainingOptions.some((t: any) => !t)) {
        return res.status(400).json({ error: "One or more selected training options not found" });
      }

      // Calculate server-side pricing (all prices in pence) with quantities
      // Use custom van value when no system van is selected
      const vanPrice = van?.price ?? (validatedData as any).customVanValue ?? 0;
      const kitPrice = kit?.price || 0;
      const upgradesTotal = upgrades.reduce((sum: number, upgrade: any) => {
        const quantity = validatedData.selectedUpgrades?.[upgrade.id] || 1;
        return sum + (upgrade?.price || 0) * quantity;
      }, 0);
      const trainingTotal = trainingOptions.reduce((sum: number, trainingOption: any) => {
        return sum + (trainingOption?.price || 0);
      }, 0);
      
      const subtotal = vanPrice + kitPrice + upgradesTotal + trainingTotal;
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

      // Send confirmation email to customer + notification to admin (non-blocking)
      try {
        const { sendQuoteReceivedEmails } = await import('./email.js');
        await sendQuoteReceivedEmails({
          quote,
          vanTitle: van?.title ?? null,
          kitName: kit?.name ?? null,
          upgradeNames: upgrades.filter(Boolean).map((u: any) => u.name),
        });
      } catch (emailErr) {
        console.error('Failed to send quote received emails:', emailErr);
      }

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

      // Send confirmation email to customer + notification to admin (non-blocking)
      try {
        const { sendLeadReceivedEmails } = await import('./email.js');
        await sendLeadReceivedEmails(lead);
      } catch (emailErr) {
        console.error('Failed to send lead received emails:', emailErr);
      }

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
      
      // Debug: Log air-systems upgrades to check popular field
      if (upgradesByCategory['air-systems']) {
        const compressor = upgradesByCategory['air-systems'].find(u => u.id === 'compressor-12hp-270l');
        if (compressor) {
          console.log('Compressor upgrade being sent to frontend:', {
            id: compressor.id,
            name: compressor.name,
            popular: compressor.popular
          });
        }
      }
      
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
  app.get("/api/admin/vans", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const vans = await storage.getVansAdmin();
      res.json(vans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vans" });
    }
  });

  app.post("/api/admin/vans", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.put("/api/admin/vans/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.delete("/api/admin/vans/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.post("/api/admin/vans/fix-acls", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const vans = await storage.getVans();
      let fixedCount = 0;
      let errorCount = 0;
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
            // Retry mechanism for GCS eventual consistency
            let success = false;
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                if (attempt > 0) {
                  await new Promise(resolve => setTimeout(resolve, 200 * attempt));
                }
                await objectStorageService.trySetObjectEntityAclPolicy(imageUrl, {
                  owner: 'system',
                  visibility: 'public'
                });
                fixedCount++;
                success = true;
                break;
              } catch (error: any) {
                if (attempt === 2) {
                  console.error(`Failed to set ACL for ${imageUrl} after 3 attempts:`, error.message);
                  errorCount++;
                }
              }
            }
          }
        }
      }

      res.json({ 
        success: true, 
        fixedCount, 
        errorCount,
        message: errorCount > 0 
          ? `Fixed ${fixedCount} images, ${errorCount} failed` 
          : `Fixed ${fixedCount} images successfully`
      });
    } catch (error) {
      console.error("Error fixing van image ACLs:", error);
      res.status(500).json({ error: "Failed to fix van image ACLs" });
    }
  });

  // Add image to van - NEW SIMPLIFIED VERSION
  app.post("/api/admin/vans/:id/images", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.delete("/api/admin/vans/:id/images", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.put("/api/admin/vans/:id/hero-image", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.put("/api/admin/vans/:id/images/reorder", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.post("/api/admin/vehicle-lookup", isAuthenticated, isBasicAdmin, async (req, res) => {
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

      // Extract Euro emissions standard
      const euroStatus = specsData?.EmissionsAndFuelConsumption?.EuroEmissionsStandard || 
                        regData?.euroEmissionsStandard || 
                        null;
      
      // Transform API response to our van format
      const vanData = {
        registration: cleanReg,
        make: regData.make || '',
        model: regData.model || '',
        year: parseInt(regData.yearOfManufacture) || new Date().getFullYear(),
        euroStatus: euroStatus,
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

  // AI Description Generator for Vans (using OpenAI via Replit AI Integrations)
  app.post("/api/admin/generate-van-description", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const { make, model, year, transmission, size, fuel, mileage, engine } = req.body;

      if (!make || !model || !year) {
        return res.status(400).json({ error: "Make, model, and year are required" });
      }

      // Import OpenAI SDK
      const OpenAI = (await import('openai')).default;

      // Initialize OpenAI client with Replit AI Integrations
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Build context string from van details
      const vanDetails = [
        `${year} ${make} ${model}`,
        size ? `${size} (${size === 'SWB' ? 'Short Wheel Base' : size === 'MWB' ? 'Medium Wheel Base' : 'Long Wheel Base'})` : '',
        transmission || '',
        fuel || '',
        mileage ? `${mileage.toLocaleString()} miles` : '',
        engine || '',
      ].filter(Boolean).join(' • ');

      // Create completion with mobile tyre van focus
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional automotive copywriter specializing in commercial vehicle sales for mobile tyre businesses. Your descriptions are concise, professional, and highlight practical benefits for mobile tyre fitting operations."
          },
          {
            role: "user",
            content: `Write a compelling sales description (2-3 paragraphs, around 150 words) for this van as a mobile tyre van:

${vanDetails}

Focus on:
- Spacious interior perfect for carrying tyre equipment and stock
- Reliability and build quality for daily mobile operations
- Professional appearance for customer visits
- Practical features that benefit mobile tyre fitting businesses
- Load capacity and accessibility

Keep it professional, concise, and sales-focused. Do not include pricing or warranty details.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const description = completion.choices[0]?.message?.content?.trim();

      if (!description) {
        throw new Error("No description generated");
      }

      res.json({ description });
    } catch (error) {
      console.error("Error generating description:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  });

  // Admin CRUD endpoints for kits
  app.get("/api/admin/kits", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const kits = await storage.getKitsAdmin();
      res.json(kits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kits" });
    }
  });

  app.post("/api/admin/kits", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.put("/api/admin/kits/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.delete("/api/admin/kits/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  // Update kit sort order
  app.patch("/api/admin/kits/:id/sort-order", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const { sortOrder } = req.body;
      
      if (typeof sortOrder !== 'number') {
        return res.status(400).json({ error: "sortOrder must be a number" });
      }
      
      const kit = await storage.updateKit(req.params.id, { sortOrder });
      if (!kit) {
        return res.status(404).json({ error: "Kit not found" });
      }
      res.json(kit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sort order" });
    }
  });

  // Admin CRUD endpoints for upgrades
  app.get("/api/admin/upgrades", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const upgrades = await storage.getAllUpgradesAdmin();
      res.json(upgrades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upgrades" });
    }
  });

  app.post("/api/admin/upgrades", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.put("/api/admin/upgrades/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.delete("/api/admin/upgrades/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      // Check if this upgrade has child variations
      const allUpgrades = await storage.getAllUpgradesAdmin();
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
  app.patch("/api/admin/upgrades/:id/sort-order", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.get("/api/admin/finance-plans", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const plans = await storage.getFinancePlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance plans" });
    }
  });

  app.post("/api/admin/finance-plans", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const planData = insertFinancePlanSchema.parse(req.body);
      const plan = await storage.createFinancePlan(planData);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Failed to create finance plan" });
    }
  });

  app.put("/api/admin/finance-plans/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  app.delete("/api/admin/finance-plans/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  // Gallery Items - Admin endpoints
  function normalizeGalleryFileUrl(url: string): string {
    if (!url) return url;
    // Fix broken /objects/https:/ pattern created by old upload code
    // Note: browsers normalize /objects/https:// to /objects/https:/ (single slash)
    if (url.startsWith('/objects/https:') || url.startsWith('/objects/http:')) {
      // Restore the double-slash after the scheme so new URL() can parse it
      const rawGcs = url.replace(/^\/objects\//, '');
      const gcsUrl = rawGcs.replace(/^(https?):\/([^/])/, '$1://$2');
      try {
        const parsed = new URL(gcsUrl);
        const p = parsed.pathname;
        const productMatch = p.match(/\/product-images\/([^?]+)/);
        if (productMatch) return `/objects/product-images/${productMatch[1]}`;
        const vanMatch = p.match(/\/van-images\/([^?]+)/);
        if (vanMatch) return `/objects/van-images/${vanMatch[1]}`;
        const upgradeMatch = p.match(/\/upgrade-images\/([^?]+)/);
        if (upgradeMatch) return `/objects/upgrade-images/${upgradeMatch[1]}`;
        const videosMatch = p.match(/\/videos\/([^?]+)/);
        if (videosMatch) return `/objects/videos/${videosMatch[1]}`;
        const uploadsMatch = p.match(/\/uploads\/([^?]+)/);
        if (uploadsMatch) return `/objects/uploads/${uploadsMatch[1]}`;
      } catch {}
    }
    return url;
  }

  app.get("/api/admin/gallery-items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = await storage.getGalleryItemsAdmin();
      const normalized = items.map(item => ({
        ...item,
        fileUrl: normalizeGalleryFileUrl(item.fileUrl),
        thumbnailUrl: item.thumbnailUrl ? normalizeGalleryFileUrl(item.thumbnailUrl) : item.thumbnailUrl,
      }));
      res.json(normalized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  app.post("/api/admin/gallery-items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const itemData = insertGalleryItemSchema.parse(req.body);
      const item = await storage.createGalleryItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to create gallery item" });
    }
  });

  app.put("/api/admin/gallery-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const itemData = insertGalleryItemSchema.partial().parse(req.body);
      const item = await storage.updateGalleryItem(req.params.id, itemData);
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to update gallery item" });
    }
  });

  app.delete("/api/admin/gallery-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteGalleryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gallery item" });
    }
  });

  // Gallery Items - Public endpoint
  app.get("/api/gallery-items", async (req, res) => {
    try {
      const items = await storage.getGalleryItems();
      const normalized = items.map(item => ({
        ...item,
        fileUrl: normalizeGalleryFileUrl(item.fileUrl),
        thumbnailUrl: item.thumbnailUrl ? normalizeGalleryFileUrl(item.thumbnailUrl) : item.thumbnailUrl,
      }));
      res.json(normalized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery items" });
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
  app.get("/api/admin/quotes", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/admin/quotes/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.get("/api/quotes/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
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
        completedBuildStages: z.array(z.string()).optional(),
        customBuildStages: z.array(z.object({ id: z.string(), label: z.string() })).nullable().optional(),
        featuredInPortfolio: z.boolean().optional(),
        graphicsArtworkUrl: z.string().url().or(z.literal('')).nullable().optional(),
        graphicsArtworkNotes: z.string().nullable().optional(),
        discountType: z.enum(['percentage', 'fixed']).nullable().optional(),
        discountValue: z.number().int().nullable().optional(),
        adminNotes: z.string().nullable().optional(),
        customerNotes: z.string().nullable().optional(),
        // New note text to append to history
        newAdminNote: z.string().optional(),
        newCustomerNote: z.string().optional(),
        // Service type (car / commercial / hybrid)
        serviceType: z.enum(["car", "commercial", "hybrid"]).nullable().optional(),
        // Configuration fields
        vanId: z.string().nullable().optional(),
        kitId: z.string().nullable().optional(),
        selectedUpgradeIds: z.array(z.string()).optional(),
        selectedUpgrades: z.record(z.number()).optional(),
        estSubtotal: z.number().int().optional(),
        estDiscount: z.number().int().optional(),
        estVAT: z.number().int().optional(),
        estTotal: z.number().int().optional(),
        // Custom van (off-website) fields
        customVanDescription: z.string().nullable().optional(),
        customVanValue: z.number().int().nullable().optional(),
        // Finance overrides
        financePlanId: z.string().nullable().optional(),
        financeInputs: z.object({
          deposit: z.number().optional(),
          term: z.number().optional(),
          balloon: z.number().optional(),
        }).nullable().optional(),
        // Van registration and mileage (for finance submissions)
        vanRegistration: z.string().nullable().optional(),
        vanMileage: z.number().int().nullable().optional(),
        // Customer confirmation flag
        customerConfirmed: z.boolean().optional(),
        // Customer info fields
        userName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().nullable().optional(),
      });

      const validatedData = allowedUpdates.parse(req.body);
      
      // Handle new notes - append to history
      if (validatedData.newAdminNote || validatedData.newCustomerNote) {
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ error: "Quote not found" });
        }
        
        const user = req.user as any;
        const author = user?.username || 'Admin';
        
        // Append new admin note to history
        if (validatedData.newAdminNote && validatedData.newAdminNote.trim()) {
          const existingAdminHistory = quote.adminNotesHistory || [];
          (validatedData as any).adminNotesHistory = [
            ...existingAdminHistory,
            {
              text: validatedData.newAdminNote.trim(),
              timestamp: new Date().toISOString(),
              author
            }
          ];
        }
        
        // Append new customer note to history
        if (validatedData.newCustomerNote && validatedData.newCustomerNote.trim()) {
          const existingCustomerHistory = quote.customerNotesHistory || [];
          (validatedData as any).customerNotesHistory = [
            ...existingCustomerHistory,
            {
              text: validatedData.newCustomerNote.trim(),
              timestamp: new Date().toISOString(),
              author
            }
          ];
        }
        
        // Remove the temporary fields
        delete (validatedData as any).newAdminNote;
        delete (validatedData as any).newCustomerNote;
      }
      
      // If configuration OR discount fields changed, recalculate pricing server-side
      const needsRecalculation = 'vanId' in validatedData || 'kitId' in validatedData || 
                                  'selectedUpgradeIds' in validatedData || 'selectedUpgrades' in validatedData ||
                                  'discountType' in validatedData || 'discountValue' in validatedData ||
                                  'customVanValue' in validatedData;
      
      if (needsRecalculation) {
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ error: "Quote not found" });
        }
        
        // Get the configuration (use updated values or fall back to existing)
        const vanId = 'vanId' in validatedData ? validatedData.vanId : quote.vanId;
        const customVanValue = 'customVanValue' in validatedData ? validatedData.customVanValue : (quote as any).customVanValue;
        const kitId = 'kitId' in validatedData ? validatedData.kitId : quote.kitId;
        const selectedUpgradeIds = validatedData.selectedUpgradeIds || quote.selectedUpgradeIds || [];
        const selectedUpgrades = validatedData.selectedUpgrades || quote.selectedUpgrades || {};
        const trainingOptionIds = quote.trainingOptionIds || [];
        const discountType = 'discountType' in validatedData ? validatedData.discountType : quote.discountType;
        const discountValue = 'discountValue' in validatedData ? validatedData.discountValue : quote.discountValue;
        
        // Recalculate base pricing (before discount)
        let baseSubtotal = 0;
        
        // Add van price — either a system van lookup or a custom van value
        if (vanId) {
          const van = await storage.getVan(vanId);
          if (van) {
            baseSubtotal += van.price;
          }
        } else if (customVanValue) {
          // Custom/off-website van — value stored in pence directly
          baseSubtotal += customVanValue;
        }
        
        // Add kit price
        if (kitId) {
          const kit = await storage.getKit(kitId);
          if (kit) {
            baseSubtotal += kit.price;
          }
        }
        
        // Add upgrade prices
        for (const upgradeId of selectedUpgradeIds) {
          const upgrade = await storage.getUpgrade(upgradeId);
          if (upgrade) {
            const quantity = selectedUpgrades[upgradeId] || 1;
            baseSubtotal += upgrade.price * quantity;
          }
        }
        
        // Add training option prices
        for (const trainingId of trainingOptionIds) {
          const training = await storage.getTrainingOption(trainingId);
          if (training) {
            baseSubtotal += training.price;
          }
        }
        
        // Calculate total with VAT first
        const baseVAT = Math.round(baseSubtotal * 0.2);
        const baseTotalWithVat = baseSubtotal + baseVAT;
        
        // Apply discount to total including VAT
        let discountAmount = 0;
        if (discountType && discountValue) {
          if (discountType === "percentage") {
            discountAmount = Math.round((baseTotalWithVat * discountValue) / 100);
          } else if (discountType === "fixed") {
            discountAmount = discountValue;
          }
        }
        
        // Clamp discount to prevent negative totals
        discountAmount = Math.min(discountAmount, baseTotalWithVat);
        
        const totalAfterDiscount = baseTotalWithVat - discountAmount;
        // Back-calculate VAT from final total (VAT is 1/6 of total when rate is 20%)
        const finalVAT = Math.round(totalAfterDiscount / 6);
        const finalSubtotal = totalAfterDiscount - finalVAT;
        
        // Store final pricing and discount amount
        validatedData.estSubtotal = finalSubtotal;
        validatedData.estVAT = finalVAT;
        validatedData.estTotal = totalAfterDiscount;
        (validatedData as any).estDiscount = discountAmount;
      }
      
      // Auto-audit note: status change
      if (validatedData.status) {
        const statusLabels: Record<string, string> = {
          pending: 'Pending', new: 'New', contacted: 'Contacted',
          payment_finance: 'Payment / Finance', in_build: 'In Build', completed: 'Completed'
        };
        const currentQuote = await storage.getQuote(req.params.id);
        if (currentQuote && currentQuote.status !== validatedData.status) {
          const user = req.user as any;
          const author = user?.username || 'System';
          const from = statusLabels[currentQuote.status] || currentQuote.status;
          const to = statusLabels[validatedData.status] || validatedData.status;
          const existingHistory = (validatedData as any).adminNotesHistory || currentQuote.adminNotesHistory || [];
          (validatedData as any).adminNotesHistory = [
            ...existingHistory,
            { text: `Status changed from "${from}" to "${to}"`, timestamp: new Date().toISOString(), author }
          ];
        }
      }

      const updated = await storage.updateQuote(req.params.id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('PATCH /api/admin/quotes/:id Zod validation failed. Body keys:', Object.keys(req.body), 'Errors:', JSON.stringify(error.errors));
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      console.error('PATCH /api/admin/quotes/:id unexpected error:', error);
      res.status(500).json({ error: "Failed to update quote" });
    }
  });

  // Delete a quote (admin only)
  app.delete("/api/admin/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteQuote(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });

  // Edit a specific note in the history
  app.patch("/api/admin/quotes/:id/notes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { noteType, timestamp, text } = req.body;
      
      // Validate input
      if (!noteType || !timestamp || !text) {
        return res.status(400).json({ error: "noteType, timestamp, and text are required" });
      }
      
      if (noteType !== 'admin' && noteType !== 'customer') {
        return res.status(400).json({ error: "noteType must be 'admin' or 'customer'" });
      }
      
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const historyField = noteType === 'admin' ? 'adminNotesHistory' : 'customerNotesHistory';
      const history = quote[historyField] || [];
      
      // Find and update the note with matching timestamp
      const noteIndex = history.findIndex((note: any) => note.timestamp === timestamp);
      if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Update the note text (keep original timestamp and author)
      history[noteIndex].text = text.trim();
      
      // Update the quote
      const updated = await storage.updateQuote(req.params.id, {
        [historyField]: history
      });
      
      if (!updated) {
        return res.status(500).json({ error: "Failed to update note" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Delete a specific note from the history
  app.delete("/api/admin/quotes/:id/notes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { noteType, timestamp } = req.body;
      
      // Validate input
      if (!noteType || !timestamp) {
        return res.status(400).json({ error: "noteType and timestamp are required" });
      }
      
      if (noteType !== 'admin' && noteType !== 'customer') {
        return res.status(400).json({ error: "noteType must be 'admin' or 'customer'" });
      }
      
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const historyField = noteType === 'admin' ? 'adminNotesHistory' : 'customerNotesHistory';
      const history = quote[historyField] || [];
      
      // Filter out the note with matching timestamp
      const updatedHistory = history.filter((note: any) => note.timestamp !== timestamp);
      
      if (updatedHistory.length === history.length) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Update the quote
      const updated = await storage.updateQuote(req.params.id, {
        [historyField]: updatedHistory
      });
      
      if (!updated) {
        return res.status(500).json({ error: "Failed to delete note" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Send spec summary email to customer (admin triggered — no status change)
  app.post("/api/admin/quotes/:id/send-confirmation", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Generate a fresh approval token (resets any prior approval when resending)
      const { randomBytes } = await import('crypto');
      const approvalToken = randomBytes(32).toString('hex');

      // Fetch van, kit, upgrade details for the email
      const [van, kit, selectedUpgrades] = await Promise.all([
        quote.vanId ? storage.getVan(quote.vanId) : Promise.resolve(null),
        quote.kitId ? storage.getKit(quote.kitId) : Promise.resolve(null),
        quote.selectedUpgradeIds && quote.selectedUpgradeIds.length > 0
          ? Promise.all(quote.selectedUpgradeIds.map((uid: string) => storage.getUpgrade(uid)))
          : Promise.resolve([]),
      ]);

      // Calculate discount
      const totalWithVat = quote.estSubtotal + quote.estVAT;
      let discount = 0;
      if (quote.discountType && quote.discountValue) {
        if (quote.discountType === 'percentage') {
          discount = Math.round((totalWithVat * quote.discountValue) / 100);
        } else {
          discount = quote.discountValue;
        }
      }

      // Get latest customer-facing note
      const customerNotesHistory = quote.customerNotesHistory || [];
      const latestCustomerNote = customerNotesHistory.length > 0
        ? customerNotesHistory[customerNotesHistory.length - 1].text
        : null;

      const { sendQuoteSpecSummaryEmail } = await import('./email.js');
      await sendQuoteSpecSummaryEmail({
        to: quote.email,
        customerName: quote.userName,
        quoteId: quote.id,
        vanTitle: van?.title ?? null,
        kitName: kit?.name ?? null,
        upgradeNames: selectedUpgrades.filter(Boolean).map((u: any) => u.name),
        subtotal: quote.estSubtotal,
        vat: quote.estVAT,
        total: totalWithVat,
        discount: discount > 0 ? discount : undefined,
        customerNote: latestCustomerNote,
        approvalToken,
      });

      // Record specSentAt, store approval token (resets prior approval), add auto-audit note
      const specUser = req.user as any;
      const specAuthor = specUser?.username || 'System';
      const specNoteText = `Spec summary email sent to customer (${quote.email})`;
      await storage.updateQuote(req.params.id, {
        specSentAt: new Date(),
        approvalToken,
        specApprovalStatus: null,
        specApprovalComments: null,
        adminNotesHistory: [
          ...(quote.adminNotesHistory || []),
          { text: specNoteText, timestamp: new Date().toISOString(), author: specAuthor }
        ],
      } as any);

      res.json({ success: true, emailSent: true, specSentAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error sending spec summary email:', error);
      res.status(500).json({ error: "Failed to send summary email" });
    }
  });

  // Send finance submission email to finance company
  app.post("/api/admin/quotes/:id/send-finance", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      // Get finance company email from site settings
      const settings = await storage.getSiteSettings();
      const financeEmail = settings.finance_company_email || 'stephen.quinn@jigsawfinance.com';

      // Fetch van, kit, upgrade details
      const [van, kit, selectedUpgrades] = await Promise.all([
        quote.vanId ? storage.getVan(quote.vanId) : Promise.resolve(null),
        quote.kitId ? storage.getKit(quote.kitId) : Promise.resolve(null),
        quote.selectedUpgradeIds && quote.selectedUpgradeIds.length > 0
          ? Promise.all(quote.selectedUpgradeIds.map((uid: string) => storage.getUpgrade(uid)))
          : Promise.resolve([]),
      ]);

      // Calculate discount
      const totalWithVat = quote.estSubtotal + quote.estVAT;
      let discount = 0;
      if (quote.discountType && quote.discountValue) {
        if (quote.discountType === 'percentage') {
          discount = Math.round((totalWithVat * quote.discountValue) / 100);
        } else {
          discount = quote.discountValue;
        }
      }

      // Build finance details from saved financeInputs.
      // Admin saves nullify financePlanId, so fall back to the site-wide 10.9% HP APR
      // (same logic as the Finance Calculator in the admin UI).
      let financeDetails: {
        planType: string;
        apr: number;
        depositAmount: number;
        termMonths: number;
        monthlyPayment: number;
        weeklyPayment: number;
      } | undefined;

      if (quote.financeInputs?.deposit !== undefined && quote.financeInputs?.deposit !== null && quote.financeInputs?.term) {
        const depositAmount = quote.financeInputs.deposit;
        const termMonths = quote.financeInputs.term;
        const principal = totalWithVat - (discount > 0 ? discount : 0) - depositAmount;

        // Prefer stored finance plan APR; fall back to the standard 10.9% HP rate
        let aprDecimal = 0.109;
        let planType = 'HP';
        if (quote.financePlanId) {
          const financePlan = await storage.getFinancePlan(quote.financePlanId);
          if (financePlan) {
            aprDecimal = financePlan.aprBps / 10000;
            planType = financePlan.type;
          }
        }

        if (principal > 0 && termMonths > 0) {
          const monthlyRate = aprDecimal / 12;
          let monthlyPayment: number;
          if (monthlyRate === 0) {
            monthlyPayment = Math.round(principal / termMonths);
          } else {
            const pv = Math.pow(1 + monthlyRate, termMonths);
            monthlyPayment = Math.round((principal * monthlyRate * pv) / (pv - 1));
          }
          const weeklyPayment = Math.round((monthlyPayment * 12) / 52);
          financeDetails = {
            planType,
            apr: aprDecimal * 100,
            depositAmount,
            termMonths,
            monthlyPayment,
            weeklyPayment,
          };
        }
      }

      const { sendFinanceSubmissionEmail } = await import('./email.js');
      await sendFinanceSubmissionEmail({
        financeCompanyEmail: financeEmail,
        customerName: quote.userName,
        customerPhone: quote.phone,
        customerEmail: quote.email,
        quoteId: quote.id,
        vanTitle: van?.title ?? null,
        vanRegistration: req.body.vanRegistration !== undefined ? req.body.vanRegistration : (quote.vanRegistration ?? null),
        vanMileage: req.body.vanMileage !== undefined ? req.body.vanMileage : (quote.vanMileage ?? null),
        kitName: kit?.name ?? null,
        upgradeNames: selectedUpgrades.filter(Boolean).map((u: any) => u.name),
        subtotal: quote.estSubtotal,
        vat: quote.estVAT,
        total: totalWithVat,
        discount: discount > 0 ? discount : undefined,
        financeDetails,
      });

      // Record when finance email was sent, persist reg/mileage, and add auto-audit note
      const financeUser = req.user as any;
      const financeAuthor = financeUser?.username || 'System';
      const financeUpdates: any = {
        financeSentAt: new Date(),
        status: 'awaiting_finance' as const,
        adminNotesHistory: [
          ...(quote.adminNotesHistory || []),
          { text: `Finance submission sent to ${financeEmail} for ${quote.userName}`, timestamp: new Date().toISOString(), author: financeAuthor }
        ],
      };
      if (req.body.vanRegistration !== undefined) financeUpdates.vanRegistration = req.body.vanRegistration;
      if (req.body.vanMileage !== undefined) financeUpdates.vanMileage = req.body.vanMileage;
      await storage.updateQuote(req.params.id, financeUpdates);

      res.json({ success: true, sentTo: financeEmail });
    } catch (error) {
      console.error('Error sending finance email:', error);
      res.status(500).json({ error: "Failed to send finance email" });
    }
  });

  // Send finance preview email to the logged-in admin's own email
  app.post("/api/admin/quotes/:id/send-finance-preview", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      // req.user is not populated by this app (no Passport) — look up the user via session
      const sessionUserId = (req.session as any)?.user?.id;
      const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
      const recipientEmail: string = req.body.previewEmail?.trim() || sessionUser?.email || "";
      if (!recipientEmail) {
        return res.status(400).json({ error: "Please enter an email address to send the preview to." });
      }

      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      const [van, kit, selectedUpgrades] = await Promise.all([
        quote.vanId ? storage.getVan(quote.vanId) : Promise.resolve(null),
        quote.kitId ? storage.getKit(quote.kitId) : Promise.resolve(null),
        quote.selectedUpgradeIds && quote.selectedUpgradeIds.length > 0
          ? Promise.all(quote.selectedUpgradeIds.map((uid: string) => storage.getUpgrade(uid)))
          : Promise.resolve([]),
      ]);

      const totalWithVat = quote.estSubtotal + quote.estVAT;
      let discount = 0;
      if (quote.discountType && quote.discountValue) {
        if (quote.discountType === 'percentage') {
          discount = Math.round((totalWithVat * quote.discountValue) / 100);
        } else {
          discount = quote.discountValue;
        }
      }

      let financeDetails: {
        planType: string;
        apr: number;
        depositAmount: number;
        termMonths: number;
        monthlyPayment: number;
        weeklyPayment: number;
      } | undefined;

      if (quote.financeInputs?.deposit !== undefined && quote.financeInputs?.deposit !== null && quote.financeInputs?.term) {
        const depositAmount = quote.financeInputs.deposit;
        const termMonths = quote.financeInputs.term;
        const principal = totalWithVat - (discount > 0 ? discount : 0) - depositAmount;

        let aprDecimal = 0.109;
        let planType = 'HP';
        if (quote.financePlanId) {
          const financePlan = await storage.getFinancePlan(quote.financePlanId);
          if (financePlan) {
            aprDecimal = financePlan.aprBps / 10000;
            planType = financePlan.type;
          }
        }

        if (principal > 0 && termMonths > 0) {
          const monthlyRate = aprDecimal / 12;
          let monthlyPayment: number;
          if (monthlyRate === 0) {
            monthlyPayment = Math.round(principal / termMonths);
          } else {
            const pv = Math.pow(1 + monthlyRate, termMonths);
            monthlyPayment = Math.round((principal * monthlyRate * pv) / (pv - 1));
          }
          const weeklyPayment = Math.round((monthlyPayment * 12) / 52);
          financeDetails = {
            planType,
            apr: aprDecimal * 100,
            depositAmount,
            termMonths,
            monthlyPayment,
            weeklyPayment,
          };
        }
      }

      const { sendFinanceSubmissionEmail } = await import('./email.js');
      await sendFinanceSubmissionEmail({
        financeCompanyEmail: recipientEmail,
        customerName: quote.userName,
        customerPhone: quote.phone,
        customerEmail: quote.email,
        quoteId: quote.id,
        vanTitle: van?.title ?? null,
        vanRegistration: req.body.vanRegistration !== undefined ? req.body.vanRegistration : (quote.vanRegistration ?? null),
        vanMileage: req.body.vanMileage !== undefined ? req.body.vanMileage : (quote.vanMileage ?? null),
        kitName: kit?.name ?? null,
        upgradeNames: selectedUpgrades.filter(Boolean).map((u: any) => u.name),
        subtotal: quote.estSubtotal,
        vat: quote.estVAT,
        total: totalWithVat,
        discount: discount > 0 ? discount : undefined,
        financeDetails,
      });

      res.json({ success: true, sentTo: recipientEmail });
    } catch (error) {
      console.error('Error sending finance preview email:', error);
      res.status(500).json({ error: "Failed to send finance preview email" });
    }
  });

  // Public quote confirmation endpoint (no auth required)
  app.get("/api/quote/confirm/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const quotes = await storage.getQuotes();
      const quote = quotes.find(q => q.confirmationToken === token);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found or link expired" });
      }

      // Fetch related data for full configuration details
      let van = null;
      let kit = null;
      let upgrades: any[] = [];
      let financePlan = null;

      if (quote.vanId) {
        van = await storage.getVan(quote.vanId);
      }

      if (quote.kitId) {
        kit = await storage.getKit(quote.kitId);
      }

      if (quote.selectedUpgradeIds && quote.selectedUpgradeIds.length > 0) {
        upgrades = await Promise.all(
          quote.selectedUpgradeIds.map(id => storage.getUpgrade(id))
        );
        // Filter out nulls and add quantity info
        upgrades = upgrades.filter(Boolean).map(upgrade => ({
          ...upgrade,
          quantity: quote.selectedUpgrades[upgrade.id] || 1
        }));
      }

      if (quote.financePlanId) {
        financePlan = await storage.getFinancePlan(quote.financePlanId);
      }

      // Return full configuration details (no internal admin fields)
      const customerSafeQuote = {
        id: quote.id,
        userName: quote.userName,
        email: quote.email,
        phone: quote.phone,
        company: quote.company,
        van,
        kit,
        upgrades,
        financePlan,
        financeInputs: quote.financeInputs,
        estSubtotal: quote.estSubtotal,
        estVAT: quote.estVAT,
        estTotal: quote.estTotal,
        estDiscount: quote.estDiscount,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        customerNotesHistory: quote.customerNotesHistory, // Only customer notes history, NOT adminNotesHistory
        status: quote.status,
        createdAt: quote.createdAt,
        confirmedAt: quote.confirmedAt,
      };

      res.json(customerSafeQuote);
    } catch (error) {
      console.error('Error fetching quote by token:', error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  // Confirm quote (public endpoint)
  app.post("/api/quote/confirm/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const quotes = await storage.getQuotes();
      const quote = quotes.find(q => q.confirmationToken === token);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote not found or link expired" });
      }

      // Check if already confirmed to prevent replay
      if ((quote.status === 'deposit_taken' || quote.status === 'in_build' || quote.status === 'completed') && quote.confirmedAt) {
        return res.json({ success: true, alreadyConfirmed: true });
      }

      // Update quote to deposit_taken status and clear token (one-time use)
      const updated = await storage.updateQuote(quote.id, {
        status: 'deposit_taken' as const,
        confirmedAt: new Date(),
        confirmationToken: null, // Clear token to prevent reuse
      });

      if (!updated) {
        return res.status(500).json({ error: "Failed to confirm quote" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error confirming quote:', error);
      res.status(500).json({ error: "Failed to confirm quote" });
    }
  });

  // Customer submits corrections to their quote (public endpoint, token-gated)
  app.post("/api/quote/correct/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { corrections } = req.body;

      if (!corrections || typeof corrections !== 'string' || !corrections.trim()) {
        return res.status(400).json({ error: "Corrections text is required" });
      }

      const quotes = await storage.getQuotes();
      const quote = quotes.find(q => q.confirmationToken === token);

      if (!quote) {
        return res.status(404).json({ error: "Quote not found or link expired" });
      }

      const newNote = {
        text: `Customer correction request:\n${corrections.trim()}`,
        timestamp: new Date().toISOString(),
        author: "Customer",
      };

      const updatedHistory = [...(quote.adminNotesHistory || []), newNote];

      await storage.updateQuote(quote.id, {
        adminNotesHistory: updatedHistory,
      });

      // Notify internal team
      const INTERNAL_NOTIFY_EMAILS = ['carl@geg.co', 'info@gfukgroup.co.uk'];
      try {
        const { sendEmail } = await import('./email.js');
        await sendEmail({
          to: INTERNAL_NOTIFY_EMAILS,
          subject: `Quote Correction Request — ${quote.userName}`,
          html: `
            <h2>A customer has requested corrections to their quote</h2>
            <p><strong>Customer:</strong> ${quote.userName}</p>
            <p><strong>Email:</strong> ${quote.email}</p>
            <p><strong>Quote ID:</strong> ${quote.id}</p>
            <hr/>
            <h3>Their corrections:</h3>
            <p style="white-space:pre-wrap; background:#f5f5f5; padding:12px; border-radius:6px;">${corrections.trim()}</p>
            <hr/>
            <p>Please review the quote in the admin panel and make any necessary adjustments.</p>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send correction notification email:', emailErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving quote correction:', error);
      res.status(500).json({ error: "Failed to save corrections" });
    }
  });

  // Public spec approval — get quote info by approval token
  app.get("/api/spec-approval/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const quotes = await storage.getQuotes();
      const quote = (quotes as any[]).find(q => q.approvalToken === token);
      if (!quote) {
        return res.status(404).json({ error: "Approval link not found or has expired" });
      }
      // Return only safe fields needed for the approval page
      const ref = quote.id.slice(0, 8).toUpperCase();
      res.json({
        ref,
        customerName: quote.userName,
        specApprovalStatus: quote.specApprovalStatus || null,
        specApprovalComments: quote.specApprovalComments || null,
      });
    } catch (error) {
      console.error('Error fetching spec approval:', error);
      res.status(500).json({ error: "Failed to fetch approval info" });
    }
  });

  // Public spec approval — submit customer approval or rejection
  app.post("/api/spec-approval/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { status, comments } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      if (status === 'rejected' && (!comments || !comments.trim())) {
        return res.status(400).json({ error: "Please describe what needs changing" });
      }

      const quotes = await storage.getQuotes();
      const quote = (quotes as any[]).find(q => q.approvalToken === token);
      if (!quote) {
        return res.status(404).json({ error: "Approval link not found or has expired" });
      }

      const auditNote = {
        text: status === 'approved'
          ? `Customer confirmed the spec is correct`
          : `Customer flagged spec as incorrect: "${comments.trim()}"`,
        timestamp: new Date().toISOString(),
        author: 'Customer',
      };

      await storage.updateQuote(quote.id, {
        specApprovalStatus: status,
        specApprovalComments: status === 'rejected' ? comments.trim() : null,
        adminNotesHistory: [...(quote.adminNotesHistory || []), auditNote],
      } as any);

      // Notify internal team
      const INTERNAL_NOTIFY_EMAILS = ['carl@geg.co', 'info@gfukgroup.co.uk'];
      const ref = quote.id.slice(0, 8).toUpperCase();
      try {
        const { sendEmail } = await import('./email.js');
        const subject = status === 'approved'
          ? `Spec Approved — ${quote.userName} (Ref #${ref})`
          : `Spec Flagged as Incorrect — ${quote.userName} (Ref #${ref})`;
        const html = status === 'approved'
          ? `<h2>Customer confirmed their spec is correct</h2>
             <p><strong>Customer:</strong> ${quote.userName}</p>
             <p><strong>Email:</strong> ${quote.email}</p>
             <p><strong>Reference:</strong> #${ref}</p>
             <p style="color:#166534;">The customer is happy with their specification.</p>`
          : `<h2>Customer flagged their spec as incorrect</h2>
             <p><strong>Customer:</strong> ${quote.userName}</p>
             <p><strong>Email:</strong> ${quote.email}</p>
             <p><strong>Reference:</strong> #${ref}</p>
             <hr/>
             <h3>Customer's comments:</h3>
             <p style="white-space:pre-wrap; background:#fef2f2; padding:12px; border-radius:6px; border-left:4px solid #ef4444;">${comments.trim()}</p>
             <hr/>
             <p>Please review and update the quote in the admin panel.</p>`;
        await sendEmail({ to: INTERNAL_NOTIFY_EMAILS, subject, html });
      } catch (emailErr) {
        console.error('Failed to send spec approval notification:', emailErr);
      }

      res.json({ success: true, status });
    } catch (error) {
      console.error('Error saving spec approval:', error);
      res.status(500).json({ error: "Failed to save approval" });
    }
  });

  app.get("/api/admin/leads", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.patch("/api/admin/leads/:id", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const { status, crmNotes } = req.body;
      const updateData: Record<string, any> = {};
      if (status !== undefined) updateData.status = status;
      if (crmNotes !== undefined) updateData.crmNotes = crmNotes;
      const updated = await storage.updateLead(req.params.id, updateData);
      if (!updated) return res.status(404).json({ error: "Lead not found" });
      res.json(updated);
    } catch (error) {
      console.error('PATCH /api/admin/leads/:id error:', error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Analytics endpoint
  app.get("/api/admin/analytics", isAuthenticated, isBasicAdmin, async (req, res) => {
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

  // ============================================================
  // Web Analytics Collection (public endpoints, no auth required)
  // ============================================================

  // Helper to hash IP for GDPR compliance
  const hashIp = (ip: string): string => {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  };

  // POST /api/analytics/session - create or update a visitor session
  app.post("/api/analytics/session", async (req, res) => {
    try {
      const { sessionId, userAgent, deviceType, browser, os, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, entryPage } = req.body;
      if (!sessionId) return res.json({ ok: false });

      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      const ipHash = hashIp(ip);

      // Detect if this request is from a logged-in admin — exclude from customer analytics
      const sessionUser = (req.session as any)?.user;
      const isAdmin = !!(sessionUser?.id);

      // Upsert session
      await pool.query(`
        INSERT INTO analytics_sessions (session_id, user_agent, device_type, browser, os, ip_hash, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, entry_page, is_admin, last_seen_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (session_id) DO UPDATE SET last_seen_at = NOW(), is_admin = GREATEST(analytics_sessions.is_admin, $14)
      `, [sessionId, userAgent, deviceType, browser, os, ipHash, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, entryPage, isAdmin]);

      res.json({ ok: true });
    } catch (error) {
      console.error("Analytics session error:", error);
      res.json({ ok: false });
    }
  });

  // POST /api/analytics/mark-admin - mark the current analytics session as admin traffic
  app.post("/api/analytics/mark-admin", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.json({ ok: false });
      await pool.query(`UPDATE analytics_sessions SET is_admin = TRUE WHERE session_id = $1`, [sessionId]);
      res.json({ ok: true });
    } catch (error) {
      res.json({ ok: false });
    }
  });

  // POST /api/analytics/pageview - record a page view
  app.post("/api/analytics/pageview", async (req, res) => {
    try {
      const { sessionId, url, title, referrer } = req.body;
      if (!sessionId || !url) return res.json({ ok: false });

      const sessionUser = (req.session as any)?.user;
      const isAdmin = !!(sessionUser?.id);

      await pool.query(`
        INSERT INTO analytics_pageviews (session_id, url, title, referrer)
        VALUES ($1, $2, $3, $4)
      `, [sessionId, url, title, referrer]);

      // Update session: increment page count, set bounce=false if more than 1 page, update exit page
      // Also ensure is_admin is set if this is an admin browsing
      await pool.query(`
        UPDATE analytics_sessions
        SET page_count = page_count + 1,
            bounce = (page_count + 1 <= 1),
            exit_page = $2,
            last_seen_at = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
            is_admin = GREATEST(is_admin, $3)
        WHERE session_id = $1
      `, [sessionId, url, isAdmin]);

      res.json({ ok: true });
    } catch (error) {
      console.error("Analytics pageview error:", error);
      res.json({ ok: false });
    }
  });

  // POST /api/analytics/event - record a custom event
  app.post("/api/analytics/event", async (req, res) => {
    try {
      const { sessionId, eventName, eventData, url } = req.body;
      if (!sessionId || !eventName) return res.json({ ok: false });

      const sessionUser = (req.session as any)?.user;
      const isAdmin = !!(sessionUser?.id);

      await pool.query(`
        INSERT INTO analytics_events (session_id, event_name, event_data, url)
        VALUES ($1, $2, $3, $4)
      `, [sessionId, eventName, JSON.stringify(eventData || {}), url]);

      // Update session last seen and admin status
      await pool.query(`
        UPDATE analytics_sessions SET last_seen_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER, is_admin = GREATEST(is_admin, $2) WHERE session_id = $1
      `, [sessionId, isAdmin]);

      res.json({ ok: true });
    } catch (error) {
      console.error("Analytics event error:", error);
      res.json({ ok: false });
    }
  });

  // ============================================================
  // Web Analytics Admin Query Endpoint
  // ============================================================
  app.get("/api/admin/analytics/web", isAuthenticated, isBasicAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString();

      // All session queries exclude admin traffic so stats reflect real customers only
      const EXCL_ADMIN = "AND NOT is_admin";

      // Overview stats
      const [sessionsResult, pageviewsResult, avgDurationResult, bounceResult] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM analytics_sessions WHERE started_at >= $1 ${EXCL_ADMIN}`, [cutoffStr]),
        pool.query(`SELECT COUNT(*) as count FROM analytics_pageviews pv JOIN analytics_sessions s ON pv.session_id = s.session_id WHERE pv.created_at >= $1 ${EXCL_ADMIN}`, [cutoffStr]),
        pool.query(`SELECT AVG(duration_seconds) as avg FROM analytics_sessions WHERE started_at >= $1 AND duration_seconds IS NOT NULL ${EXCL_ADMIN}`, [cutoffStr]),
        pool.query(`SELECT COUNT(*) FILTER (WHERE bounce = true) as bounced, COUNT(*) as total FROM analytics_sessions WHERE started_at >= $1 ${EXCL_ADMIN}`, [cutoffStr]),
      ]);

      const totalSessions = parseInt(sessionsResult.rows[0].count);
      const totalPageviews = parseInt(pageviewsResult.rows[0].count);
      const avgDuration = Math.round(parseFloat(avgDurationResult.rows[0].avg) || 0);
      const bounceData = bounceResult.rows[0];
      const bounceRate = bounceData.total > 0 ? Math.round((bounceData.bounced / bounceData.total) * 100) : 0;

      // Daily visitors (last N days)
      const dailyResult = await pool.query(`
        SELECT
          DATE(started_at) as date,
          COUNT(*) as sessions,
          SUM(page_count) as pageviews
        FROM analytics_sessions
        WHERE started_at >= $1 ${EXCL_ADMIN}
        GROUP BY DATE(started_at)
        ORDER BY date ASC
      `, [cutoffStr]);

      // Traffic sources
      const trafficResult = await pool.query(`
        SELECT
          CASE
            WHEN utm_medium = 'cpc' OR utm_medium = 'paid' OR utm_medium = 'ppc' THEN 'Paid Search'
            WHEN utm_source IS NOT NULL AND utm_source != '' THEN 'Campaign'
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer ~* '(google\\.com|bing\\.com|yahoo\\.com|duckduckgo\\.com|baidu\\.com|yandex\\.com)' THEN 'Organic Search'
            WHEN referrer ~* '(facebook\\.com|instagram\\.com|twitter\\.com|x\\.com|linkedin\\.com|tiktok\\.com|pinterest\\.com|reddit\\.com|youtube\\.com)' THEN 'Social'
            ELSE 'Referral'
          END as source,
          COUNT(*) as count
        FROM analytics_sessions
        WHERE started_at >= $1 ${EXCL_ADMIN}
        GROUP BY 1
        ORDER BY count DESC
      `, [cutoffStr]);

      // Top pages
      const topPagesResult = await pool.query(`
        SELECT pv.url, COUNT(*) as views, COUNT(DISTINCT pv.session_id) as unique_visitors
        FROM analytics_pageviews pv
        JOIN analytics_sessions s ON pv.session_id = s.session_id
        WHERE pv.created_at >= $1 AND NOT s.is_admin
        GROUP BY pv.url
        ORDER BY views DESC
        LIMIT 20
      `, [cutoffStr]);

      // Device breakdown
      const devicesResult = await pool.query(`
        SELECT COALESCE(device_type, 'Unknown') as device, COUNT(*) as count
        FROM analytics_sessions
        WHERE started_at >= $1 ${EXCL_ADMIN}
        GROUP BY device_type
        ORDER BY count DESC
      `, [cutoffStr]);

      // Browser breakdown
      const browsersResult = await pool.query(`
        SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as count
        FROM analytics_sessions
        WHERE started_at >= $1 ${EXCL_ADMIN}
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
      `, [cutoffStr]);

      // OS breakdown
      const osResult = await pool.query(`
        SELECT COALESCE(os, 'Unknown') as os, COUNT(*) as count
        FROM analytics_sessions
        WHERE started_at >= $1 ${EXCL_ADMIN}
        GROUP BY os
        ORDER BY count DESC
        LIMIT 10
      `, [cutoffStr]);

      // Top events
      const eventsResult = await pool.query(`
        SELECT ae.event_name, COUNT(*) as count
        FROM analytics_events ae
        JOIN analytics_sessions s ON ae.session_id = s.session_id
        WHERE ae.created_at >= $1 AND NOT s.is_admin
        GROUP BY ae.event_name
        ORDER BY count DESC
        LIMIT 15
      `, [cutoffStr]);

      // UTM Campaigns
      const campaignsResult = await pool.query(`
        SELECT
          COALESCE(utm_source, 'unknown') as source,
          COALESCE(utm_medium, 'unknown') as medium,
          COALESCE(utm_campaign, 'unknown') as campaign,
          COUNT(*) as sessions,
          SUM(page_count) as pageviews,
          AVG(duration_seconds)::INTEGER as avg_duration
        FROM analytics_sessions
        WHERE started_at >= $1 AND utm_source IS NOT NULL AND utm_source != '' ${EXCL_ADMIN}
        GROUP BY utm_source, utm_medium, utm_campaign
        ORDER BY sessions DESC
        LIMIT 20
      `, [cutoffStr]);

      // Recent sessions (exclude admin sessions)
      const recentSessionsResult = await pool.query(`
        SELECT session_id, device_type, browser, os, referrer, entry_page, exit_page, page_count, bounce, duration_seconds, utm_source, utm_medium, utm_campaign, started_at, last_seen_at
        FROM analytics_sessions
        WHERE NOT is_admin
        ORDER BY started_at DESC
        LIMIT 50
      `);

      // Top referrers
      const referrersResult = await pool.query(`
        SELECT
          COALESCE(
            CASE
              WHEN referrer ~ '^https?://([^/]+)' THEN regexp_replace(referrer, '^https?://([^/?#]+).*', '\\1')
              ELSE referrer
            END,
            'Direct'
          ) as domain,
          COUNT(*) as count
        FROM analytics_sessions
        WHERE started_at >= $1 AND referrer IS NOT NULL AND referrer != '' ${EXCL_ADMIN}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 15
      `, [cutoffStr]);

      res.json({
        overview: {
          totalSessions,
          totalPageviews,
          avgDuration,
          bounceRate,
          pagesPerSession: totalSessions > 0 ? Math.round((totalPageviews / totalSessions) * 10) / 10 : 0,
        },
        dailyStats: dailyResult.rows,
        trafficSources: trafficResult.rows,
        topPages: topPagesResult.rows,
        devices: devicesResult.rows,
        browsers: browsersResult.rows,
        operatingSystems: osResult.rows,
        topEvents: eventsResult.rows,
        campaigns: campaignsResult.rows,
        recentSessions: recentSessionsResult.rows,
        topReferrers: referrersResult.rows,
      });
    } catch (error) {
      console.error("Web analytics error:", error);
      res.status(500).json({ error: "Failed to fetch web analytics" });
    }
  });

  // Serve media files (videos, images) from attached_assets folder
  // Supports HTTP range requests for video streaming
  // Using /media/ to avoid conflicts with Vite's /assets/ in production builds
  app.get("/media/:filename(*)", (req, res) => {
    try {
      const filename = req.params.filename;
      const assetsRoot = path.resolve(process.cwd(), 'attached_assets');
      const assetsPath = path.resolve(assetsRoot, filename);
      
      console.log('📁 Static asset request:', filename);
      
      // Security: Prevent path traversal attacks
      // Use path.relative to ensure the requested file is within assetsRoot
      const relativePath = path.relative(assetsRoot, assetsPath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        console.log('❌ Path traversal attempt blocked:', assetsPath);
        return res.status(403).send('Forbidden');
      }
      
      // Check if file exists
      if (!fs.existsSync(assetsPath)) {
        console.log('❌ Asset not found:', assetsPath);
        return res.status(404).send('Asset not found');
      }
      
      // Get file stats
      const stat = fs.statSync(assetsPath);
      const fileSize = stat.size;
      
      // Set appropriate headers for videos
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Set common headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Handle range requests for video streaming
      const range = req.headers.range;
      
      if (range) {
        // Parse range header (e.g., "bytes=0-1023")
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;
        
        // Create read stream for the requested range
        const fileStream = fs.createReadStream(assetsPath, { start, end });
        
        // Set partial content headers
        res.status(206); // Partial Content
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        
        fileStream.pipe(res);
        console.log(`✅ Serving asset (range ${start}-${end}):`, filename);
      } else {
        // No range request, send entire file
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Accept-Ranges', 'bytes');
        
        const fileStream = fs.createReadStream(assetsPath);
        fileStream.pipe(res);
        console.log('✅ Serving asset (full):', filename);
      }
    } catch (error) {
      console.error('Error serving static asset:', error);
      res.status(500).send('Error serving asset');
    }
  });

  // Cache GCS file metadata to avoid repeated getMetadata() calls for every video range request
  const videoMetadataCache = new Map<string, { size: number; contentType: string; cachedAt: number }>();
  const VIDEO_METADATA_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Referenced from blueprint: javascript_object_storage - protected file uploading
  // Handle CORS preflight for images and videos
  app.options("/objects/:objectPath(*)", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.sendStatus(200);
  });
  
  // The endpoint for serving objects with ACL checks (public and private)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    
    try {
      const isVideo = req.path.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
      console.log(isVideo ? '🎥 Video request:' : '🖼️ Image request:', req.path);
      
      // Get the object file reference
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check if this is a public file (van, product, kit, upgrade images/videos - skip ACL)
      const isPublic = req.path.includes('/van-images/') || 
                      req.path.includes('/product-images/') || 
                      req.path.includes('/uploads/') || 
                      req.path.includes('/upgrade-images/') ||
                      req.path.includes('/videos/');
      
      // Perform ACL check BEFORE fetching metadata
      if (!isPublic) {
        const userId = (req as any).user?.id;
        const { ObjectPermission } = await import("./objectAcl");
        console.log('🔐 Checking access permissions...');
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: userId,
          requestedPermission: ObjectPermission.READ,
        });
        if (!canAccess) {
          console.log('❌ Access denied for:', req.path);
          return res.sendStatus(401);
        }
        console.log('✅ Access granted');
      } else {
        console.log('✅ Public file - serving without ACL check');
      }
      
      // For videos, support range requests for streaming
      if (isVideo) {
        const videoMimeTypes: Record<string, string> = {
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.ogg': 'video/ogg',
          '.mov': 'video/quicktime',
        };
        const videoExt = (req.path.match(/\.[^.]+$/) || [''])[0].toLowerCase();
        const extContentType = videoMimeTypes[videoExt] || 'video/mp4';

        try {
          // Use cached metadata to avoid hitting GCS API on every range request
          const cacheKey = req.path;
          const cached = videoMetadataCache.get(cacheKey);
          let fileSize: number;
          let resolvedContentType: string;

          if (cached && (Date.now() - cached.cachedAt) < VIDEO_METADATA_TTL_MS) {
            fileSize = cached.size;
            resolvedContentType = cached.contentType;
          } else {
            const [metadata] = await objectFile.getMetadata();
            fileSize = parseInt(metadata.size as string);
            resolvedContentType = metadata.contentType || extContentType;
            videoMetadataCache.set(cacheKey, { size: fileSize, contentType: resolvedContentType, cachedAt: Date.now() });
          }

          const range = req.headers.range;
          
          if (range) {
            // Parse range header
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            
            // Validate range
            if (start >= fileSize || end >= fileSize || start > end) {
              console.log('❌ Invalid range requested:', range);
              return res.status(416).send('Range Not Satisfiable');
            }
            
            const chunkSize = end - start + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Content-Length', chunkSize);
            res.setHeader('Content-Type', resolvedContentType);
            res.setHeader('Accept-Ranges', 'bytes');
            
            // Stream the requested range with error handling
            const stream = objectFile.createReadStream({ start, end });
            
            stream.on('error', (streamError: any) => {
              console.error('❌ Stream error:', streamError);
              if (!res.headersSent) {
                res.status(500).send('Error streaming video');
              }
            });
            
            stream.pipe(res);
            console.log(`✅ Streaming video (range ${start}-${end}):`, req.path);
          } else {
            // No range request, send entire file
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Type', resolvedContentType);
            res.setHeader('Accept-Ranges', 'bytes');
            
            const stream = objectFile.createReadStream();
            
            stream.on('error', (streamError: any) => {
              console.error('❌ Stream error:', streamError);
              if (!res.headersSent) {
                res.status(500).send('Error streaming video');
              }
            });
            
            stream.pipe(res);
            console.log('✅ Streaming video (full):', req.path);
          }
        } catch (videoError) {
          console.error('❌ Error preparing video stream:', videoError);
          if (!res.headersSent) {
            return res.status(500).send('Error preparing video');
          }
        }
      } else {
        // For images, use the standard download method
        console.log('✅ Serving file:', req.path);
        objectStorageService.downloadObject(objectFile, res);
      }
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        console.log('❌ File not found:', req.path);
        return res.sendStatus(404);
      }
      if (!res.headersSent) {
        return res.sendStatus(500);
      }
    }
  });

  // The endpoint for getting the upload URL for public product images (kits)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      
      // Validate file type - now supports images and videos
      const allowedTypes = [
        'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
      ];
      if (!contentType || !allowedTypes.includes(contentType.toLowerCase())) {
        return res.status(400).json({ error: "Only images (PNG, JPEG, SVG, GIF, WEBP) and videos (MP4, WebM, OGG, MOV) are allowed" });
      }
      
      // Validate filename
      if (!filename || filename.trim() === '') {
        return res.status(400).json({ error: "Filename is required" });
      }
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, publicURL } = await objectStorageService.getPublicProductUploadURL(filename);
      // Return publicURL as objectPath for backwards compatibility with uploader
      res.json({ uploadURL, objectPath: publicURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Backend proxy endpoint for upgrade image uploads (no CORS issues)
  app.post("/api/upgrades/upload-image", isAuthenticated, async (req, res) => {
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
        
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        
        // Upload file to public storage (returns backend proxy path /objects/upgrade-images/...)
        const publicURL = await objectStorageService.uploadUpgradeImageToPublicStorage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        
        console.log('✅ Upgrade image uploaded successfully:', publicURL);
        res.json({ publicURL });
      } catch (error) {
        console.error("Error uploading upgrade image:", error);
        res.status(500).json({ error: "Failed to upload image" });
      }
    });
  });

  // Admin endpoint for temporary image upload (for create forms)
  app.post("/api/admin/temp-upload", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.post("/api/admin/vans/:id/upload-image", isAuthenticated, isBasicAdmin, async (req, res) => {
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
  app.post("/api/admin/objects/set-acl", isAuthenticated, isBasicAdmin, async (req, res) => {
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
      
      // Retry mechanism for GCS eventual consistency
      let lastError;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          if (attempt > 0) {
            // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms, 800ms)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
          }
          const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);
          return res.json({ objectPath: normalizedPath });
        } catch (error: any) {
          lastError = error;
          // Only retry on "Object not found" errors
          if (!error.message?.includes('not found') && !error.code?.includes('404')) {
            throw error;
          }
        }
      }
      
      // All retries failed
      throw lastError;
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

  // ============================================================
  // SEO: 301 Permanent Redirects for domain migration
  // ============================================================
  const permanentRedirects: Record<string, string> = {
    '/vans-1': '/stock',
    '/vanfinance': '/finance',
    '/info': '/configurator',
    '/all-projects': '/gallery',
  };

  Object.entries(permanentRedirects).forEach(([from, to]) => {
    app.get(from, (_req, res) => {
      res.redirect(301, to);
    });
  });

  // Redirect all old /vans/* URLs to /stock
  app.get('/vans/*', (_req, res) => {
    res.redirect(301, '/stock');
  });

  // ============================================================
  // SEO: Server-side meta tag injection for dynamic routes
  // ============================================================
  app.get('/stock/:slug', async (req, res, next) => {
    try {
      const van = await storage.getVanBySlug(req.params.slug);
      if (van && van.published) {
        req.__seoMeta = buildVanMeta(van);
      }
    } catch (e) {
      // Non-fatal: page will use default meta
    }
    next();
  });

  // ============================================================
  // SEO: robots.txt
  // ============================================================
  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(`User-agent: *
Allow: /

Disallow: /admin/
Disallow: /admin
Disallow: /api/
Disallow: /login
Disallow: /portal/

Sitemap: https://www.mobiletyrevancity.co.uk/sitemap.xml
`);
  });

  // ============================================================
  // SEO: Dynamic XML Sitemap
  // ============================================================
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const SITE_URL = 'https://www.mobiletyrevancity.co.uk';
      const BUILD_DATE = '2026-03-15';

      const staticPages = [
        { url: '/', changefreq: 'weekly', priority: '1.0' },
        { url: '/stock', changefreq: 'daily', priority: '0.9' },
        { url: '/configurator', changefreq: 'monthly', priority: '0.9' },
        { url: '/finance', changefreq: 'monthly', priority: '0.8' },
        { url: '/training', changefreq: 'monthly', priority: '0.8' },
        { url: '/business-opportunity', changefreq: 'monthly', priority: '0.8' },
        { url: '/gallery', changefreq: 'weekly', priority: '0.7' },
        { url: '/about', changefreq: 'monthly', priority: '0.7' },
        { url: '/contact', changefreq: 'monthly', priority: '0.6' },
        { url: '/how-it-works', changefreq: 'monthly', priority: '0.6' },
      ];

      const vans = await storage.getVans();
      const publishedVans = vans.filter(v => v.published && v.slug);

      const staticEntries = staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

      const vanEntries = publishedVans.map(van => {
        const lastmod = van.updatedAt
          ? new Date(van.updatedAt).toISOString().split('T')[0]
          : BUILD_DATE;
        const heroImg = van.heroImage || (van.images && van.images[0]);
        const absoluteImgUrl = heroImg
          ? (heroImg.startsWith('http') ? heroImg : `${SITE_URL}${heroImg.startsWith('/') ? '' : '/'}${heroImg}`)
          : null;
        const imageTag = absoluteImgUrl
          ? `
    <image:image>
      <image:loc>${absoluteImgUrl}</image:loc>
      <image:title>${van.year} ${van.make} ${van.model} - Mobile Tyre Van</image:title>
    </image:image>`
          : '';
        return `
  <url>
    <loc>${SITE_URL}/stock/${van.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageTag}
  </url>`;
      }).join('');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticEntries}
${vanEntries}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Failed to generate sitemap');
    }
  });

  // One-time catalog sync endpoint: replaces production catalog data with dev data
  app.post("/api/admin/sync-catalog", isAuthenticated, isFullAdmin, async (req, res) => {
    try {
      const syncDataPath = path.join(process.cwd(), "server", "catalog-sync-data.json");
      if (!fs.existsSync(syncDataPath)) {
        return res.status(404).json({ error: "Sync data file not found" });
      }
      const syncData = JSON.parse(fs.readFileSync(syncDataPath, "utf-8"));
      const { vans, kits, upgrades, training_options } = syncData;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Null out FK references in quotes so we can safely replace catalog
        await client.query("UPDATE quotes SET van_id = NULL");
        await client.query("UPDATE quotes SET kit_id = NULL");
        await client.query("UPDATE quotes SET selected_upgrade_ids = '[]'::json");
        await client.query("UPDATE quotes SET selected_upgrades = '[]'::json");
        await client.query("UPDATE quotes SET training_option_ids = '[]'::json");

        // Clear catalog tables (preserving quotes, leads, users)
        await client.query("DELETE FROM training_options");
        await client.query("DELETE FROM upgrades");
        await client.query("DELETE FROM kits");
        await client.query("DELETE FROM vans");

        // Insert vans
        for (const v of vans) {
          await client.query(
            `INSERT INTO vans (id, slug, title, make, model, year, mileage, price, vat_included, specs, images, hero_image, created_at, updated_at, published, description, euro_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::json,$11::json,$12,$13,$14,$15,$16,$17)`,
            [v.id, v.slug, v.title, v.make, v.model, v.year, v.mileage, v.price, v.vat_included,
             JSON.stringify(v.specs), JSON.stringify(v.images), v.hero_image,
             v.created_at, v.updated_at, v.published, v.description, v.euro_status]
          );
        }

        // Insert kits
        for (const k of kits) {
          await client.query(
            `INSERT INTO kits (id, name, description, includes, power_kw, price, created_at, updated_at, published, sort_order, images, euro_six_compatible)
             VALUES ($1,$2,$3,$4::json,$5,$6,$7,$8,$9,$10,$11::json,$12)`,
            [k.id, k.name, k.description, JSON.stringify(k.includes), k.power_kw, k.price,
             k.created_at, k.updated_at, k.published, k.sort_order, JSON.stringify(k.images), k.euro_six_compatible]
          );
        }

        // Insert upgrades
        for (const u of upgrades) {
          await client.query(
            `INSERT INTO upgrades (id, name, category, description, price, created_at, updated_at, published, images, parent_id, variant_name, allow_quantity, sort_order, popular, video_url, detailed_info, show_video, exclusive_group)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::json,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [u.id, u.name, u.category, u.description, u.price, u.created_at, u.updated_at,
             u.published, JSON.stringify(u.images), u.parent_id, u.variant_name,
             u.allow_quantity, u.sort_order, u.popular, u.video_url, u.detailed_info, u.show_video,
             u.exclusive_group ?? null]
          );
        }

        // Insert training options
        for (const t of training_options) {
          await client.query(
            `INSERT INTO training_options (id, name, description, includes, price, published, created_at, updated_at, type, duration_days)
             VALUES ($1,$2,$3,$4::json,$5,$6,$7,$8,$9,$10)`,
            [t.id, t.name, t.description, JSON.stringify(t.includes), t.price, t.published,
             t.created_at, t.updated_at, t.type, t.duration_days]
          );
        }

        await client.query("COMMIT");
        res.json({
          success: true,
          message: `Catalog sync complete`,
          counts: { vans: vans.length, kits: kits.length, upgrades: upgrades.length, training_options: training_options.length }
        });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Sync catalog error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Public endpoint: get site settings (video URLs etc.)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  // Admin endpoint: update a site setting
  app.put("/api/admin/site-settings/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      if (typeof value !== "string") {
        return res.status(400).json({ error: "value must be a string" });
      }
      await storage.setSiteSetting(key, value);
      res.json({ success: true, key, value });
    } catch (error) {
      res.status(500).json({ error: "Failed to update site setting" });
    }
  });

  // Admin endpoint: upload a video to object storage
  app.post("/api/admin/upload-video", isAuthenticated, isAdmin, async (req, res) => {
    const multer = await import("multer");
    const upload = multer.default({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
    });

    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload failed" });
      }
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }
        const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
        if (!allowedTypes.includes(req.file.mimetype.toLowerCase())) {
          return res.status(400).json({ error: "Only video files are allowed" });
        }
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const url = await objectStorageService.uploadVideoToPublicStorage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        res.json({ url });
      } catch (error) {
        console.error("Video upload error:", error);
        res.status(500).json({ error: "Video upload failed" });
      }
    });
  });

  (async () => {
    try {
      const settings = await storage.getSiteSettings();
      if (!settings._finance_email_reset_v1) {
        if (settings.finance_company_email && settings.finance_company_email !== 'stephen.quinn@jigsawfinance.com') {
          await storage.setSiteSetting('finance_company_email', 'stephen.quinn@jigsawfinance.com');
          console.log('Reset finance_company_email to stephen.quinn@jigsawfinance.com');
        }
        await storage.setSiteSetting('_finance_email_reset_v1', 'done');
      }
    } catch (e) {
      console.error('Failed to reset finance_company_email:', e);
    }
  })();

  const httpServer = createServer(app);

  return httpServer;
}
