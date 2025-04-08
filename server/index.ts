import express from "express";
import cors from "cors";
import { setupAuth, setupAuthRoutes } from "./auth.js";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { setupVite } from './vite.js';
import { setupWebSocket } from './websocket.js';
import session from 'express-session';
import passport from 'passport';
import { setupDatabase } from './db.js';
import dotenv from 'dotenv';
import { MemStorage } from "./storage.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS
app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Initialize passport and auth
setupAuth(app);
setupAuthRoutes(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  path: '/socket.io'
});

// Setup WebSocket with CORS
const wss = setupWebSocket(httpServer);

// Setup database
setupDatabase();

// Initialize storage
const storage = new MemStorage();

// Setup other routes
registerRoutes(app, io);

// Setup Vite in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
} else {
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
}

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const startServer = async () => {
  const port = Number(process.env.PORT) || 5000;
  
  try {
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, httpServer);
    }

    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`WebSocket server running on ws://localhost:${port}/ws`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      const newPort = port + 1;
      console.log(`Port ${port} is in use, trying port ${newPort}`);
      httpServer.listen(newPort);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  }
};

startServer();