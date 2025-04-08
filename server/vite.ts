import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server): Promise<ViteDevServer> {
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        server: server
      }
    },
    appType: 'custom'
  });

  app.use(vite.middlewares);
  return vite;
}

export function serveStatic(app: express.Application) {
  app.use(express.static("client/dist"));
  app.get("*", (req, res) => {
    res.sendFile("client/dist/index.html", { root: process.cwd() });
  });
}
