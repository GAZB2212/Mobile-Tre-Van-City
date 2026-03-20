import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cron from "node-cron";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { createUser, getSession } from "./auth";
import { pool } from "./db";
import { generateAiBlogPost } from "./blogGenerator";

const app = express();

// Session must be first middleware to ensure cookies work properly
app.set("trust proxy", true);
app.use(getSession());

// Gzip compression for all responses
app.use(compression());

// Redirect non-www to www
app.use((req, res, next) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
  if (host && !host.startsWith('www.') && host.includes('mobiletyrevancity.co.uk')) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    return res.redirect(301, `${proto}://www.${host}${req.originalUrl}`);
  }
  next();
});

// HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Bootstrap admin user on startup
async function bootstrapAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const explicitPassword = !!process.env.ADMIN_PASSWORD;

  try {
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    if (!existingAdmin) {
      await createUser({
        username: adminUsername,
        password: adminPassword,
        email: "admin@mtvc.example.com",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
      });
      log(`✅ Admin user created: ${adminUsername}`);
    } else {
      // Ensure the admin user always has the correct role
      if (existingAdmin.adminRole !== "full") {
        await storage.updateUser(existingAdmin.id, { adminRole: "full", isAdmin: true });
        log(`✅ Admin role corrected to "full" for: ${adminUsername}`);
      }

      // If ADMIN_PASSWORD env var is explicitly set, sync the password hash
      if (explicitPassword) {
        const bcrypt = await import("bcryptjs");
        const newHash = await bcrypt.hash(adminPassword, 10);
        await storage.updateUser(existingAdmin.id, { passwordHash: newHash });
        log(`✅ Admin password updated from ADMIN_PASSWORD env var`);
      } else {
        log(`✅ Admin user exists: ${adminUsername}`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to bootstrap admin user:", error);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Bootstrap admin user and run DB migrations AFTER server is listening
    // This prevents blocking deployment initialization
    // Schedule automatic AI blog post generation every Monday at 8am London time
    cron.schedule("0 8 * * 1", async () => {
      log("[Blog AI] Scheduled run — generating post...");
      try {
        const post = await generateAiBlogPost(null, true);
        log(`[Blog AI] Scheduled post saved as draft: "${post.title}"`);
      } catch (err: any) {
        console.error("[Blog AI] Scheduled generation failed:", err.message);
      }
    }, { timezone: "Europe/London" });

    setImmediate(() => {
      bootstrapAdmin().catch(err => {
        console.error("Failed to bootstrap admin:", err);
      });
      // Add is_admin column to analytics_sessions if it doesn't exist yet (production safe)
      pool.query("ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
        .then(() => log("✅ Analytics admin filter column ready"))
        .catch((err: Error) => console.error("Analytics migration:", err.message));
      // Add spec approval columns to quotes if not present
      pool.query(`
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_token TEXT UNIQUE;
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS spec_approval_status TEXT;
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS spec_approval_comments TEXT;
      `)
        .then(() => log("✅ Spec approval columns ready"))
        .catch((err: Error) => console.error("Spec approval migration:", err.message));
      // Create blog_posts table if not present
      pool.query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          content TEXT NOT NULL,
          featured_image TEXT,
          category TEXT,
          tags JSON NOT NULL DEFAULT '[]',
          published BOOLEAN NOT NULL DEFAULT FALSE,
          published_at TIMESTAMP,
          seo_title TEXT,
          seo_description TEXT,
          author_name TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `)
        .then(() => log("✅ Blog posts table ready"))
        .catch((err: Error) => console.error("Blog migration:", err.message));
    });
  });
})();
