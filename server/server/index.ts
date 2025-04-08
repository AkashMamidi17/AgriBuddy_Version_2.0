import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
import { Server } from "socket.io";
import http from "http";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const httpServer = http.createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Register routes with Socket.IO
const server = await registerRoutes(app, io);

// Development mode: Serve Vite dev server
if (process.env.NODE_ENV !== "production") {
  await setupVite(app, io);
} else {
  // Production mode: Serve static files
  app.use(express.static("client/dist"));
  app.get("*", (req, res) => {
    res.sendFile("client/dist/index.html", { root: process.cwd() });
  });
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 