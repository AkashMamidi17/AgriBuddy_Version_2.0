import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";
import "dotenv/config";

async function main() {
  const app = express();
  
  // Configure middleware
  app.use(cors());
  app.use(express.json()); // for parsing application/json
  
  // Register API routes
  const server = await registerRoutes(app);
  
  // Set up error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  });
  
  // Set up Vite for development and production
  if (process.env.NODE_ENV === "production") {
    log("Setting up static file serving for production");
    serveStatic(app);
  } else {
    log("Setting up Vite dev server");
    await setupVite(app, server);
  }

  // Get port from environment or use 5000 to match Replit's workflow expectations
  const PORT = process.env.PORT || 5000;
  
  server.listen(PORT, () => {
    log(`Server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});