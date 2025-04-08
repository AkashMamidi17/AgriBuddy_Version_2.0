import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from './types.js';
import db from './db.js';
import { storage } from './storage.js';
import { Request, Response, NextFunction } from 'express';

const setupAuth = (app: any) => {
  // Configure passport
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(parseInt(id));
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
};

const setupAuthRoutes = (app: any) => {
  // Register route
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, name, userType, location } = req.body;
      
      if (!username || !password || !name || !userType) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields",
          message: "Please provide all required fields"
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: "Username already exists",
          message: "This username is already taken. Please choose another one."
        });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password,
        name,
        userType,
        location: location || null,
        updatedAt: new Date()
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ 
            success: false,
            error: "Login failed",
            message: "Registration successful but login failed. Please try logging in manually."
          });
        }
        return res.status(201).json({ 
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            userType: user.userType,
            location: user.location
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        success: false,
        error: "Registration failed",
        message: "An unexpected error occurred during registration"
      });
    }
  });

  // Login route
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: { message?: string }) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Authentication failed",
          message: "An error occurred during authentication"
        });
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
          message: info?.message || "Invalid username or password"
        });
      }
      req.logIn(user, (err: Error | null) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Login failed",
            message: "An error occurred during login"
          });
        }
        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            userType: user.userType,
            location: user.location
          }
        });
      });
    })(req, res, next);
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Please log in to access this resource"
      });
    }
    const user = req.user as User;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        userType: user.userType,
        location: user.location
      }
    });
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err: Error | null) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Logout failed",
          message: "An error occurred during logout"
        });
      }
      res.json({
        success: true,
        message: "Logout successful"
      });
    });
  });
};

export { setupAuth, setupAuthRoutes };