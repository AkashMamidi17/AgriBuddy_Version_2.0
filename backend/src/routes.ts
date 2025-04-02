import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertPostSchema, insertBidSchema } from "../shared/schema";
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
    // Ensure videoUrl is not undefined by defaulting to null
    const videoUrl = data.videoUrl === undefined ? null : data.videoUrl;
    const post = await storage.createPost({ ...data, videoUrl, userId: req.user!.id });
    res.json(post);
  });

  // WebSocket handling for real-time updates
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
      try {
        // Check if the message is a binary buffer
        if (message instanceof Buffer) {
          console.log('Received binary WebSocket message, length:', message.length);
          
          let sessionId = 'default';
          let audioBuffer = message;
          let language = 'te'; // Default language
          
          // Check if the binary message contains a session ID prefix
          // Format: <sessionId>:<audioData>
          const messageString = message.toString();
          const sessionIdMatch = messageString.match(/^(session_[^:]+):/);
          
          if (sessionIdMatch) {
            sessionId = sessionIdMatch[1];
            // Calculate the position after the session ID and colon
            const startPos = sessionIdMatch[0].length;
            // Extract the actual audio data (create a new buffer without the prefix)
            audioBuffer = message.subarray(startPos);
            console.log(`Extracted session ID: ${sessionId} from binary message`);
          }
          
          // Send acknowledgment that processing has started
          ws.send(JSON.stringify({
            type: 'processing_started',
            message: 'Your voice recording is being processed...'
          }));
          
          // Process the voice input
          try {
            const result = await processVoiceInput(audioBuffer, language, sessionId);
            
            console.log('Voice processing completed, sending response');
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: result,
              sessionId: sessionId
            }));
          } catch (voiceError: any) {
            console.error('Voice processing error:', voiceError);
            ws.send(JSON.stringify({
              type: 'error',
              message: `Voice processing failed: ${voiceError?.message || 'Unknown error'}`
            }));
          }
        }
        // Handle JSON messages
        else {
          console.log('Received text WebSocket message');
          const data = JSON.parse(message.toString());
          console.log('Message parsed:', data.type);

          if (data.type === 'voice_input') {
            console.log('Processing voice input, language:', data.language);
            
            try {
              // Send acknowledgment that processing has started
              ws.send(JSON.stringify({
                type: 'processing_started',
                message: 'Your voice is being processed...'
              }));
              
              // Use session ID if provided or create a unique one
              const sessionId = data.sessionId || 
                               `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
              
              const result = await processVoiceInput(
                Buffer.from(data.audio, 'base64'),
                data.language || 'te',
                sessionId
              );

              console.log('Voice processing completed, sending response');
              ws.send(JSON.stringify({
                type: 'ai_response',
                content: result,
                sessionId: sessionId
              }));
            } catch (voiceError: any) {
              console.error('Voice processing error:', voiceError);
              ws.send(JSON.stringify({
                type: 'error',
                message: `Voice processing failed: ${voiceError?.message || 'Unknown error'}`
              }));
            }
          }
          
          // This section is from the original code and needs to be kept for backward compatibility
          else if (data.type === 'transcript') {
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
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error);
        try {
          ws.send(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          }));
        } catch (sendError) {
          console.error('Failed to send error message to client:', sendError);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}