import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function main() {
  const app: Express = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors());
  
  // Register API routes and get HTTP server
  const httpServer = await registerRoutes(app);
  
  // In production, serve static files from the 'dist' directory  
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    // In development, set up Vite middleware for HMR
    await setupVite(app, httpServer);
  }
  
  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`Error: ${err.message}`, "error");
    
    if (err.status) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // Default port is 5000
  const PORT = process.env.PORT || 5000;
  
  // Start the server
  httpServer.listen(PORT, () => {
    log(`serving on port ${PORT}`);
  });
}

main().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});