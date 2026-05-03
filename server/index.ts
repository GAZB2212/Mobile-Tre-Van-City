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
      // Add custom_extras column to quotes (bespoke line items not in standard configurator)
      pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS custom_extras JSONB DEFAULT '[]'`)
        .then(() => log("✅ Custom extras column ready"))
        .catch((err: Error) => console.error("Custom extras migration:", err.message));
      pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS ai_session_id VARCHAR`)
        .then(() => log("✅ Quote AI session link column ready"))
        .catch((err: Error) => console.error("Quote AI session migration:", err.message));
      pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS staff_name TEXT`)
        .then(() => log("✅ Quote staff name column ready"))
        .catch((err: Error) => console.error("Quote staff name migration:", err.message));
      // Add quote_id column to leads for linking converted leads to their quote
      pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_id VARCHAR REFERENCES quotes(id)`)
        .then(() => log("✅ Lead quote_id column ready"))
        .catch((err: Error) => console.error("Lead quote_id migration:", err.message));
      // Create blog_posts table if not present
      pool.query(`
        CREATE TABLE IF NOT EXISTS ai_conversations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR NOT NULL UNIQUE,
          status VARCHAR NOT NULL DEFAULT 'in_progress',
          messages JSON NOT NULL DEFAULT '[]',
          mapped_config JSON,
          contact_name VARCHAR,
          contact_phone VARCHAR,
          van_type VARCHAR,
          van_size VARCHAR,
          spec_level VARCHAR,
          finance_preference VARCHAR,
          includes_48v BOOLEAN NOT NULL DEFAULT FALSE,
          was_48v_pitched BOOLEAN NOT NULL DEFAULT FALSE,
          response_to_48v VARCHAR,
          suggested_upgrade_ids JSON NOT NULL DEFAULT '[]',
          added_upgrade_ids JSON NOT NULL DEFAULT '[]',
          config_completed BOOLEAN NOT NULL DEFAULT FALSE,
          marked_contacted BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        );
      `)
        .then(async () => {
          log("✅ AI conversations table ready");
          // Remove duplicate session_id rows (keep latest by created_at) so the
          // unique index can be created cleanly.
          await pool.query(`
            DELETE FROM ai_conversations
            WHERE id IN (
              SELECT id FROM (
                SELECT id,
                  ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC NULLS LAST) AS rn
                FROM ai_conversations
              ) ranked
              WHERE rn > 1
            )
          `).catch((err: Error) => console.error("AI conversations dedup:", err.message));
          // Ensure unique constraint exists so ON CONFLICT (session_id) works
          await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS ai_conversations_session_id_unique
            ON ai_conversations (session_id)
          `)
            .then(() => log("✅ AI conversations session_id unique index ready"))
            .catch((err: Error) => console.error("AI conversations unique index:", err.message));
          // Add contacted_note column if it doesn't exist (added in task #46)
          await pool.query(`ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS contacted_note TEXT`)
            .then(() => log("✅ AI conversations contacted_note column ready"))
            .catch((err: Error) => console.error("AI conversations contacted_note migration:", err.message));
        })
        .catch((err: Error) => console.error("AI conversations migration:", err.message));
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
      // Create ai_packages table and seed Bronze/Silver/Gold defaults
      pool.query(`
        CREATE TABLE IF NOT EXISTS ai_packages (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          tier INTEGER NOT NULL,
          description TEXT,
          recommended_for TEXT,
          upgrade_ids JSONB NOT NULL DEFAULT '[]',
          active BOOLEAN NOT NULL DEFAULT TRUE
        );
        INSERT INTO ai_packages (id, name, tier, description, recommended_for, upgrade_ids) VALUES
          ('bronze', 'Bronze', 1,
           'Essential starter package with everything you need to get up and running professionally.',
           'Budget-conscious, just starting out, or lower volume (under 15 jobs per day).',
           '["light-pack-standard","standard-reversing-camera","accessories-pack-1"]'::jsonb),
          ('silver', 'Silver', 2,
           'Our most popular mid-spec package — the right balance of capability and cost.',
           'Growing operations, 10–20 jobs per day, or those wanting a professional setup without going full premium.',
           '["light-pack-upgraded","front-facing-dash-camera","standard-reversing-camera","accessories-pack-2","vehicle-tracker"]'::jsonb),
          ('gold', 'Gold', 3,
           'Full-spec premium package — everything you need to run a high-volume, professional mobile tyre operation.',
           'High-volume operators (20+ jobs per day), fleet expansions, or those wanting maximum capability from day one.',
           '["light-pack-upgraded","van-cctv-system","apple-carplay","accessories-pack-3","vehicle-tracker","vehicle-immobiliser"]'::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `)
        .then(() => log("✅ AI packages table ready"))
        .catch((err: Error) => console.error("AI packages migration:", err.message));
      // Create testimonials table and seed initial records
      pool.query(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          location TEXT,
          content TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 5,
          sort_order INTEGER NOT NULL DEFAULT 0,
          published BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        INSERT INTO testimonials (id, name, company, location, content, rating, sort_order, published) VALUES
          ('seed-testimonial-001', 'James Mitchell', 'Mobile Tyre Solutions Ltd', NULL, 'Outstanding service and quality. The van conversion exceeded our expectations and we were earning from day one.', 5, 0, TRUE),
          ('seed-testimonial-002', 'Sarah Williams', 'TyreFix Mobile', NULL, 'Professional setup, great finance options, and excellent ongoing support. Highly recommend for anyone starting out.', 5, 1, TRUE),
          ('seed-testimonial-003', 'David Thompson', 'Thompson Tyres', NULL, 'Quality equipment and van conversion. The team guided us through every step of the process.', 5, 2, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `)
        .then(() => log("✅ Testimonials table ready"))
        .catch((err: Error) => console.error("Testimonials migration:", err.message));

      // Backfill: create draft quotes for any completed AI conversations that don't already
      // have a linked quote — covers cases where the customer finished Max but never submitted the form.
      pool.query(`
        INSERT INTO quotes (
          user_name, email, phone, service_type, kit_id,
          selected_upgrade_ids, selected_upgrades, training_option_ids,
          finance_plan_id, custom_van_description,
          est_subtotal, est_vat, est_total, est_discount,
          ai_session_id, status, admin_notes_history
        )
        SELECT
          COALESCE(NULLIF(TRIM(ac.contact_name), ''), 'Via Max (name pending)'),
          '',
          COALESCE(TRIM(ac.contact_phone), ''),
          ac.van_type,
          ac.spec_level,
          COALESCE((ac.mapped_config->>'upgradeIds')::jsonb, '[]'::jsonb),
          '{}'::jsonb,
          '[]'::jsonb,
          (ac.mapped_config->>'financePlanId'),
          CASE
            WHEN (ac.mapped_config->>'ownVan')::boolean = false AND ac.van_size IS NOT NULL
              THEN ac.van_size || ' van supplied by Mobile Tyre Van City'
            WHEN (ac.mapped_config->>'ownVan')::boolean = true
              THEN 'Customer''s own van'
            ELSE NULL
          END,
          0, 0, 0, 0,
          ac.session_id,
          'new',
          jsonb_build_array(jsonb_build_object(
            'text', 'Auto-created from Max AI chat — customer completed the configuration but may not have submitted the quote form. Phone number captured from Max chat.',
            'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'author', 'System'
          ))
        FROM ai_conversations ac
        WHERE ac.config_completed = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM quotes q WHERE q.ai_session_id = ac.session_id
          )
      `)
        .then((r) => { if ((r.rowCount ?? 0) > 0) log(`✅ Backfilled ${r.rowCount} draft quote(s) from completed Max conversations`); })
        .catch((err: Error) => console.error("Max backfill migration:", err.message));
    });
  });
})();
