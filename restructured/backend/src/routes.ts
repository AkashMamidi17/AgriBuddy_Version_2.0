import { Express, Request, Response } from "express";
import { Server as HttpServer, createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { processVoiceInput } from "./ai-assistant";
import { setupAuth } from "./auth";
import { log } from "./vite";

// Active WebSocket connections by session ID
const wsSessions = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<HttpServer> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    log('WebSocket client connected', 'websocket');
    let sessionId = 'default'; // Default session ID
    
    ws.on('message', async (message: any) => {
      try {
        // Check if this is a binary message (audio data)
        if (message instanceof Buffer) {
          log('Received binary data from WebSocket', 'websocket');
          
          // Check if the binary message includes a session ID prefix
          const messageStr = message.toString().slice(0, 50); // Look at first 50 bytes
          const sessionPrefix = messageStr.match(/^([^:]+):/);
          
          if (sessionPrefix) {
            // Extract the session ID from the prefix
            sessionId = sessionPrefix[1];
            // Store the WebSocket connection for this session
            wsSessions.set(sessionId, ws);
            
            // Remove the session ID prefix from the buffer
            const prefixLength = sessionPrefix[0].length;
            const audioBuffer = message.slice(prefixLength);
            
            // Process the voice input
            const result = await processVoiceInput(audioBuffer, 'te', sessionId);
            
            // Send the result back to the client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(result));
            }
          } else {
            // No session ID prefix, use default processing
            const result = await processVoiceInput(message, 'te', sessionId);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(result));
            }
          }
        } else {
          // Handle JSON messages
          log('Received JSON data from WebSocket', 'websocket');
          const parsedMessage = JSON.parse(message.toString());
          
          if (parsedMessage.type === 'init') {
            // Initialize session
            sessionId = parsedMessage.payload.sessionId || `session_${Date.now()}`;
            wsSessions.set(sessionId, ws);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'init_response',
                payload: { sessionId, message: 'Session initialized' }
              }));
            }
          } else if (parsedMessage.type === 'message') {
            // Handle text message
            const result = await processVoiceInput(
              Buffer.from(parsedMessage.payload.text || ''),
              parsedMessage.payload.language || 'te',
              sessionId
            );
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(result));
            }
          }
        }
      } catch (error) {
        log(`WebSocket error: ${(error as Error).message}`, 'error');
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: (error as Error).message }
          }));
        }
      }
    });
    
    ws.on('close', () => {
      log('WebSocket client disconnected', 'websocket');
      // Remove this connection from sessions
      for (const [id, socket] of wsSessions.entries()) {
        if (socket === ws) {
          wsSessions.delete(id);
          break;
        }
      }
    });
  });
  
  // Products API endpoints
  app.get('/api/products', async (_req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const product = await storage.createProduct({
        ...req.body,
        sellerId: req.user.id
      });
      
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post('/api/products/:id/bid', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const bid = await storage.createBid({
        productId,
        bidderId: req.user.id,
        amount: req.body.amount,
      });
      
      res.status(201).json(bid);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Community API endpoints
  app.get('/api/posts', async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post('/api/posts', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const post = await storage.createPost({
        ...req.body,
        authorId: req.user.id
      });
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  return httpServer;
}