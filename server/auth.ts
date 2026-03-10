import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { loginSchema, createUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";

// Extend Express session to include user
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      isAdmin: boolean;
      adminRole: string; // "none", "basic", or "full"
    };
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Detect if running in production (Replit deployments or NODE_ENV=production)
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';
  
  // Use memory store for development, database for production
  let sessionStore;
  if (isProduction && process.env.DATABASE_URL) {
    console.log('🗄️ Using PostgreSQL session store for production');
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    console.log('💾 Using memory session store for development');
    // Use memorystore for development (more reliable than default MemoryStore)
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session expiry on every active request
    cookie: {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // Session middleware is now set up in server/index.ts as the first middleware
  
  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = createUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid registration data", errors: result.error.errors });
      }

      const { username, password, email, firstName, lastName } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user
      const user = await createUser({
        username,
        password,
        email,
        firstName,
        lastName,
        isAdmin: false, // Never allow registration as admin
      });

      // Store user in session (auto-login after registration)
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        adminRole: user.adminRole,
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ message: "Could not create session" });
        }

        // Return user without password hash
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          sessionId: req.sessionID
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('🔐 Login attempt for:', req.body?.username);
      
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        console.log('❌ Invalid credentials format:', result.error);
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const { username, password } = result.data;
      
      console.log('📝 Looking up user:', username);
      const user = await storage.getUserByUsername(username);

      if (!user) {
        console.log('❌ User not found:', username);
        return res.status(401).json({ message: "Invalid username or password" });
      }

      console.log('🔑 Comparing password for:', username);
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log('❌ Invalid password for:', username);
        return res.status(401).json({ message: "Invalid username or password" });
      }

      console.log('✅ Password valid, creating session for:', username);
      
      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        adminRole: user.adminRole,
      };

      // Save session explicitly and also return session ID in response
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ message: "Could not create session" });
        }

        console.log('✅ Session saved successfully for:', username);
        
        // Return user without password hash AND include session ID
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
          ...userWithoutPassword,
          sessionId: req.sessionID // Send session ID in response body as fallback
        });
      });
    } catch (error) {
      console.error("❌ Login error (FULL):", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forgot password — generates token and sends reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase().trim());

      // Always respond success to prevent user enumeration
      if (!user) {
        return res.json({ message: "If that email is registered, a reset link has been sent." });
      }

      // Generate secure token valid for 1 hour
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      } as any);

      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

      try {
        const { sendPasswordResetEmail } = await import("./email.js");
        await sendPasswordResetEmail({
          toEmail: user.email!,
          firstName: user.firstName,
          username: user.username,
          resetUrl,
        });
      } catch (emailErr) {
        console.error("Failed to send password reset email:", emailErr);
      }

      res.json({ message: "If that email is registered, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password — validates token and sets new password
  app.post("/api/auth/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByResetToken(token);

      if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
        return res.status(400).json({ message: "This reset link is invalid or has expired." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      } as any);

      res.json({ message: "Password updated successfully. You can now log in." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password (for logged-in users)
  app.post("/api/auth/change-password", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.session.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash } as any);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    // Try to get session ID from Authorization header as fallback when cookies don't work
    const sessionIdFromHeader = req.headers.authorization?.replace('Bearer ', '');
    
    // If no session user but we have a session ID from header, try to load the session
    if (!req.session.user && sessionIdFromHeader) {
      // Manually load session from store using the session ID from Authorization header
      const sessionStore = req.sessionStore;
      await new Promise<void>((resolve) => {
        sessionStore.get(sessionIdFromHeader, (err, sessionData) => {
          if (!err && sessionData?.user) {
            req.session.user = sessionData.user;
          }
          resolve();
        });
      });
    }
    
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Try to get session ID from Authorization header as fallback when cookies don't work
  const sessionIdFromHeader = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🔐 isAuthenticated middleware:', {
    path: req.path,
    hasSessionUser: !!req.session.user,
    hasAuthHeader: !!sessionIdFromHeader,
    sessionId: sessionIdFromHeader ? `${sessionIdFromHeader.substring(0, 10)}...` : 'none'
  });
  
  // If no session user but we have a session ID from header, try to load the session
  if (!req.session.user && sessionIdFromHeader) {
    // Manually load session from store using the session ID from Authorization header
    const sessionStore = req.sessionStore;
    await new Promise<void>((resolve) => {
      sessionStore.get(sessionIdFromHeader, (err, sessionData) => {
        console.log('📦 Session store lookup:', {
          err: err?.message,
          foundSession: !!sessionData,
          hasUser: !!sessionData?.user
        });
        if (!err && sessionData?.user) {
          req.session.user = sessionData.user;
        }
        resolve();
      });
    });
  }
  
  if (!req.session.user) {
    console.log('❌ No session user found, returning 401');
    return res.status(401).json({ message: "Unauthorized" });
  }
  console.log('✅ User authenticated:', req.session.user.username);
  next();
};

// Middleware to check if user is admin (now checks for full admin role only)
export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user has full admin role
  if (req.session.user.adminRole !== "full") {
    return res.status(403).json({ message: "Forbidden - Full admin access required" });
  }

  // Double-check with database
  try {
    const user = await storage.getUser(req.session.user.id);
    if (!user || user.adminRole !== "full") {
      return res.status(403).json({ message: "Forbidden - Full admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user has at least basic admin role (view-only access)
export const isBasicAdmin: RequestHandler = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user has basic or full admin role
  const allowedRoles = ["basic", "full"];
  if (!allowedRoles.includes(req.session.user.adminRole)) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  // Double-check with database
  try {
    const user = await storage.getUser(req.session.user.id);
    if (!user || !allowedRoles.includes(user.adminRole)) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin role check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user has full admin role (full access including modifications)
export const isFullAdmin: RequestHandler = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user has full admin role
  if (req.session.user.adminRole !== "full") {
    return res.status(403).json({ message: "Forbidden - Full admin access required" });
  }

  // Double-check with database
  try {
    const user = await storage.getUser(req.session.user.id);
    if (!user || user.adminRole !== "full") {
      return res.status(403).json({ message: "Forbidden - Full admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin role check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to create a user with hashed password
export async function createUser(userData: {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
}): Promise<User> {
  const passwordHash = await hashPassword(userData.password);
  
  return storage.createUser({
    username: userData.username,
    passwordHash,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    isAdmin: userData.isAdmin || false,
  });
}
