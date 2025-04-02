import express, { Express } from "express";
import { Server } from "http";
import { createServer as createViteServer, ViteDevServer } from "vite";
import path from "path";
import fs from "fs";

// Logger function for better formatted logs
export function log(message: string, source = "express") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${source}] ${message}`);
}

// Setup Vite middleware for development
export async function setupVite(app: Express, server: Server) {
  log("Setting up Vite middleware");
  
  try {
    // Create Vite server instance
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    
    // Use Vite's middleware for development
    app.use(vite.middlewares);
    
    // Handle SPA routing - let the frontend router handle routes
    app.use("*", async (req, res, next) => {
      // Skip API routes - these are handled by express
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/ws")) {
        return next();
      }
      
      try {
        const url = req.originalUrl;
        
        // Read index.html from the frontend directory
        let template = fs.readFileSync(
          path.resolve("./client/index.html"),
          "utf-8"
        );
        
        // Apply Vite HTML transforms - this injects HMR and other dev features
        template = await vite.transformIndexHtml(url, template);
        
        // Send the transformed HTML as response
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (err) {
        // Let Vite handle errors in dev mode
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
    
    log("Vite middleware setup complete");
  } catch (err) {
    log(`Vite setup failed: ${(err as Error).message}`, "error");
    throw err;
  }
}

// Serve static files in production mode
export function serveStatic(app: Express) {
  log("Setting up static file serving for production");
  
  // Serve static assets
  app.use(express.static(path.resolve("./client/dist")));
  
  // Handle SPA routing for production
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api") || req.path.startsWith("/ws")) {
      return next();
    }
    
    // Serve the index.html for all non-API routes
    res.sendFile(path.resolve("./client/dist/index.html"));
  });
  
  log("Static file serving setup complete");
}