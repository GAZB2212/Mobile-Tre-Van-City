import bcrypt from "bcryptjs";
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
  
  // Use memory store for development, database for production
  let sessionStore;
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
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
    cookie: {
      httpOnly: true,
      secure: false, // Disable secure for dev - browser isn't accepting secure cookies
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
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

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

        // Return user without password hash AND include session ID
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
          ...userWithoutPassword,
          sessionId: req.sessionID // Send session ID in response body as fallback
        });
      });
    } catch (error) {
      console.error("Login error:", error);
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
