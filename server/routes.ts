import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertPostSchema, insertBidSchema } from "@shared/schema";
import { processVoiceInput } from "./ai-assistant";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Products API
  app.get("/api/products", async (req, res) => {
    const products = await storage.getAllProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct({ 
      ...data, 
      userId: req.user!.id,
      status: 'active',
      currentBid: data.price,
      biddingEndTime: data.biddingEndTime || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    res.json(product);
  });

  app.post("/api/products/:id/bid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    if (product.status !== 'active') {
      return res.status(400).send("This product is no longer available for bidding");
    }

    if (new Date(product.biddingEndTime!) < new Date()) {
      return res.status(400).send("Bidding has ended for this product");
    }

    const { amount } = insertBidSchema.parse(req.body);
    if (amount <= (product.currentBid || product.price)) {
      return res.status(400).send("Bid amount must be higher than current bid");
    }

    const bid = await storage.createBid({
      productId,
      userId: req.user!.id,
      amount
    });

    await storage.updateProduct(productId, { currentBid: amount });

    // Notify all connected clients about the new bid
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'bid',
          productId,
          amount,
          userId: req.user!.id
        }));
      }
    });

    res.json(bid);
  });

  // Posts API
  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getAllPosts();
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertPostSchema.parse(req.body);
    const post = await storage.createPost({ ...data, userId: req.user!.id });
    res.json(post);
  });

  // WebSocket handling for real-time updates
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'voice_input') {
          const result = await processVoiceInput(
            Buffer.from(data.audio, 'base64'),
            data.language
          );

          ws.send(JSON.stringify({
            type: 'ai_response',
            content: result
          }));
        }
        //This section is from the original code and needs to be kept for backward compatibility
        if (data.type === 'transcript') {
          // Echo back the transcript to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'response',
                content: `Received: ${data.content}`
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}