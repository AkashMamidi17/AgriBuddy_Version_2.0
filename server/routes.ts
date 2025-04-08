import type { Express, Request, Response } from "express";
import type { Server as HttpServer } from "http";
import express from 'express';
import { createServer } from 'http';
import { setupAuth } from './auth.js';
import { storage } from './storage.js';
import { insertProductSchema, insertPostSchema, insertBidSchema } from './schema.js';
import { processVoiceInput } from './ai-assistant.js';
import * as z from 'zod';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { createHash } from 'crypto';
import WebSocket from 'ws';
const WebSocketServer = WebSocket.Server;
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { getVideoDurationInSeconds } from "get-video-duration";
import { fileURLToPath } from "url";
import session from 'express-session';
import passport from 'passport';
import { Server } from 'socket.io';
import { Product, Bid, User } from './types.js';
import { setupVite } from "./vite.js";
import { setupAuthRoutes } from './auth.js';
import { setupPostRoutes } from './posts.js';
import { setupProductRoutes } from './products.js';
import { setupUserRoutes } from './users.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection statistics
interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  messagesProcessed: number;
  errors: number;
  lastError?: string;
  reconnections: number;
}

// Message queue for offline clients
interface QueuedMessage {
  timestamp: number;
  message: string;
  attempts: number;
  messageId: string;
  targetUserId?: number;
}

// Acknowledgment tracking
interface MessageAck {
  messageId: string;
  timestamp: number;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
}

// Connection state
interface ConnectionState {
  userId: number;
  lastSeen: number;
  isOnline: boolean;
  messageQueue: QueuedMessage[];
  pendingAcks: Map<string, MessageAck>;
}

// Custom WebSocket interface with additional properties
interface CustomWebSocket extends WebSocket {
  isAlive: boolean;
  messageCount: number;
  lastMessageTime: number;
  userId: string;
  isAuthenticated: boolean;
  connectionId: string;
  pendingAcks: Map<string, MessageAck>;
}

// WebSocket message types
type WSMessage = {
  type: 'voice_input' | 'transcript' | 'auth' | 'ping' | 'ack' | 'reconnect';
  audio?: string;
  language?: string;
  sessionId?: string;
  content?: string;
  token?: string;
  messageId?: string;
  connectionId?: string;
  targetUserId?: number;
};

type WSResponse = {
  type: 'processing_started' | 'ai_response' | 'error' | 'response' | 'auth_success' | 'auth_failed' | 'pong' | 'ack';
  message?: string;
  content?: any;
  sessionId?: string;
  code?: number;
  messageId?: string;
};

// Bid notification type
type BidNotification = {
  type: 'bid';
  productId: number;
  amount: number;
  userId: number;
};

// Message validation schemas
const voiceInputSchema = z.object({
  type: z.literal('voice_input'),
  audio: z.string(),
  language: z.string().optional(),
  sessionId: z.string().optional()
});

const transcriptSchema = z.object({
  type: z.literal('transcript'),
  content: z.string()
});

const authSchema = z.object({
  type: z.literal('auth'),
  token: z.string()
});

const ackSchema = z.object({
  type: z.literal('ack'),
  messageId: z.string()
});

const reconnectSchema = z.object({
  type: z.literal('reconnect'),
  connectionId: z.string(),
  token: z.string()
});

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_MESSAGES_PER_MINUTE: 60,
  VOICE_PROCESS_COOLDOWN: 2000,
  MAX_QUEUE_SIZE: 100,
  MAX_QUEUE_AGE: 24 * 60 * 60 * 1000,
  ACK_TIMEOUT: 30000,
  MAX_RECONNECT_ATTEMPTS: 3
};

// Custom error types
class WSError extends Error {
  constructor(message: string, public code: number = 4000) {
    super(message);
    this.name = 'WSError';
  }
}

class RateLimitError extends WSError {
  constructor(message: string) {
    super(message, 4029);
  }
}

class AuthError extends WSError {
  constructor(message: string) {
    super(message, 4001);
  }
}

class ConnectionError extends WSError {
  constructor(message: string) {
    super(message, 4002);
  }
}

// Connection state store
const connectionStates = new Map<string, ConnectionState>();

// Configure multer for video uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP4, WebM, and OGG videos are allowed."));
    }
  }
});

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      userType: string;
    };
  }
}

export const setupRoutes = (app: express.Application) => {
  // Auth routes
  setupAuthRoutes(app);

  // Post routes
  setupPostRoutes(app);

  // Product routes
  setupProductRoutes(app);

  // User routes
  setupUserRoutes(app);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
};

export async function registerRoutes(app: express.Application, io?: Server): Promise<HttpServer> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  // Connection statistics
  const stats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesProcessed: 0,
    errors: 0,
    reconnections: 0
  };

  // Function to generate unique message ID
  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Function to send compressed message with acknowledgment
  const sendCompressed = async (ws: CustomWebSocket, message: any, targetUserId?: number) => {
    const messageId = generateMessageId();
    const messageStr = JSON.stringify({ ...message, messageId });
    
    // Create acknowledgment tracking
    const ack: MessageAck = {
      messageId,
      timestamp: Date.now(),
      status: 'pending',
      attempts: 0
    };
    
    ws.pendingAcks.set(messageId, ack);

    // Queue message if target is offline
    if (targetUserId) {
      const targetState = Array.from(connectionStates.values())
        .find(state => state.userId === targetUserId);
      
      if (!targetState?.isOnline) {
        targetState?.messageQueue.push({
          timestamp: Date.now(),
          message: messageStr,
          attempts: 0,
          messageId,
          targetUserId
        });
        return;
      }
    }

    // Send message
    if (messageStr.length > 1024) {
      const compressed = await gzipAsync(messageStr);
      ws.send(compressed);
    } else {
      ws.send(messageStr);
    }

    // Set up acknowledgment timeout
    setTimeout(() => {
      if (ws.pendingAcks.has(messageId)) {
        ws.pendingAcks.delete(messageId);
      }
    }, RATE_LIMIT.ACK_TIMEOUT);
  };

  // Function to broadcast message to all or specific users
  const broadcastMessage = async (message: any, targetUserIds?: number[]) => {
    const messageId = generateMessageId();
    const messageStr = JSON.stringify({ ...message, messageId });

    wss.clients.forEach((client: WebSocket) => {
      const customClient = client as CustomWebSocket;
      if (customClient.readyState === 1 && customClient.isAuthenticated) {
        if (!targetUserIds || targetUserIds.includes(parseInt(customClient.userId))) {
          sendCompressed(customClient, message, parseInt(customClient.userId));
        }
      }
    });
  };

  // Function to process queued messages
  const processMessageQueue = async (ws: CustomWebSocket) => {
    const now = Date.now();
    const state = connectionStates.get(ws.connectionId);
    if (!state) return;

    const validMessages = state.messageQueue.filter(msg => 
      now - msg.timestamp < RATE_LIMIT.MAX_QUEUE_AGE
    );

    for (const msg of validMessages) {
      try {
        await sendCompressed(ws, JSON.parse(msg.message), msg.targetUserId);
        msg.attempts++;
      } catch (error) {
        console.error('Failed to send queued message:', error);
        if (msg.attempts >= 3) {
          state.messageQueue = state.messageQueue.filter(m => m !== msg);
        }
      }
    }

    // Remove old messages
    state.messageQueue = state.messageQueue.filter(msg => 
      now - msg.timestamp < RATE_LIMIT.MAX_QUEUE_AGE
    );
  };

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false,
        error: "You must be logged in to create a product" 
      });
    }

    try {
      const user = req.user as User | undefined;
      
      if (!user?.id) {
        return res.status(401).json({ 
          success: false,
          error: "User not authenticated" 
        });
      }

      const { name, description, price, imageUrl, category } = req.body;
      
      if (!name || !description || !price || !category) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields" 
        });
      }

      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ 
          success: false,
          error: "Price must be a positive number" 
        });
      }

      const product = await storage.createProduct({
        name,
        description,
        price: priceNum,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1610348725531-843dff563e2c",
        category,
        userId: user.id,
        status: "active",
        currentBid: null,
        biddingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      res.status(201).json({
        success: true,
        product
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.userId !== (req.user as any).id) {
        return res.status(403).json({ error: "You are not authorized to delete this product" });
      }

      await storage.updateProduct(productId, { status: 'deleted' });
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(400).json({ error: "Failed to delete product" });
    }
  });

  app.post("/api/products/:id/bid", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ error: "This product is no longer available for bidding" });
      }

      if (new Date(product.biddingEndTime!) < new Date()) {
        return res.status(400).json({ error: "Bidding has ended for this product" });
      }

      const { amount } = insertBidSchema.parse(req.body);
      if (amount <= (product.currentBid || product.price)) {
        return res.status(400).json({ error: "Bid amount must be higher than current bid" });
      }

      const bid = await storage.createBid({
        productId,
        userId: (req.user as any).id,
        amount
      });

      await storage.updateProduct(productId, { currentBid: amount });

      // Notify all connected clients about the new bid
      const bidNotification: BidNotification = {
        type: 'bid',
        productId,
        amount,
        userId: (req.user as any).id
      };

      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(bidNotification));
        }
      });

      res.json(bid);
    } catch (error) {
      console.error("Error processing bid:", error);
      res.status(400).json({ error: "Invalid bid data" });
    }
  });

  // Posts API
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertPostSchema.parse(req.body);
      const videoUrl = data.videoUrl === undefined ? null : data.videoUrl;
      const post = await storage.createPost({ 
        ...data, 
        videoUrl, 
        userId: (req.user as any).id,
        likes: 0,
        shares: 0,
        saves: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  // Video upload endpoint
  app.post("/api/upload", upload.single("video"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const videoPath = req.file.path;
      const videoUrl = `/uploads/${req.file.filename}`;
      const thumbnailPath = path.join(__dirname, "uploads", `${path.parse(req.file.filename).name}.jpg`);

      // Generate thumbnail using ffmpeg (you'll need to implement this)
      // For now, we'll just use a placeholder
      const videoThumbnail = videoUrl.replace(path.extname(videoUrl), ".jpg");

      // Get video duration
      const duration = await getVideoDurationInSeconds(videoPath);

      res.json({
        videoUrl,
        videoThumbnail,
        videoDuration: Math.round(duration)
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.post("/api/posts/video", async (req: Request, res: Response) => {
    try {
      const { title, content, videoUrl, videoThumbnail, videoDuration } = req.body;
      const userId = (req.user as any)?.id || 1; // Default to user 1 for demo

      const post = await storage.createPost({
        title,
        content,
        videoUrl,
        videoThumbnail,
        videoDuration,
        userId,
        likes: 0,
        shares: 0,
        saves: 0
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating video post:", error);
      res.status(500).json({ error: "Failed to create video post" });
    }
  });

  // Like a post
  app.post("/api/posts/:id/like", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const updatedPost = await storage.updatePost(postId, {
        likes: (post.likes || 0) + 1
      });

      res.json(updatedPost);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  // Share a post
  app.post("/api/posts/:id/share", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const updatedPost = await storage.updatePost(postId, {
        shares: (post.shares || 0) + 1
      });

      res.json(updatedPost);
    } catch (error) {
      console.error("Error sharing post:", error);
      res.status(500).json({ error: "Failed to share post" });
    }
  });

  // Save a post
  app.post("/api/posts/:id/save", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const updatedPost = await storage.updatePost(postId, {
        saves: (post.saves || 0) + 1
      });

      res.json(updatedPost);
    } catch (error) {
      console.error("Error saving post:", error);
      res.status(500).json({ error: "Failed to save post" });
    }
  });

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket) => {
    const customWs = ws as CustomWebSocket;
    customWs.isAlive = true;
    customWs.messageCount = 0;
    customWs.lastMessageTime = Date.now();
    customWs.isAuthenticated = false;
    customWs.connectionId = generateMessageId();
    customWs.pendingAcks = new Map();

    stats.totalConnections++;
    stats.activeConnections++;

    ws.on('close', () => {
      stats.activeConnections--;
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      stats.errors++;
    });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, userType, location } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password,
        name,
        userType,
        location
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        res.status(201).json({ message: "Registration successful", user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login route
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: req.user });
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  return httpServer;
}

// Token verification function
async function verifyToken(token: string): Promise<number> {
  const userId = parseInt(token);
  if (isNaN(userId)) {
    throw new AuthError('Invalid token');
  }
  return userId;
}