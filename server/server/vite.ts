import { createServer as createViteServer } from "vite";
import express from "express";
import { Server } from "socket.io";

export async function setupVite(app: express.Application, io: Server) {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
      root: process.cwd(),
      base: "/",
    });

    app.use(vite.middlewares);

    console.log("Vite dev server initialized successfully");
    return vite;
  } catch (error) {
    console.error("Failed to initialize Vite dev server:", error);
    throw error;
  }
}

export function serveStatic(app: express.Application) {
  app.use(express.static("client/dist"));
  app.get("*", (req, res) => {
    res.sendFile("client/dist/index.html", { root: process.cwd() });
  });
} 