import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import { z } from 'zod';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { processVoiceInput } from './ai-assistant.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const WebSocketServer = WebSocket.Server;

// WebSocket message types
type WSMessage = {
  type: 'voice_input' | 'transcript' | 'auth' | 'ping' | 'ack' | 'reconnect';
  audio?: string;
  language?: string;
  sessionId?: string;
  content?: string;
  token?: string;
  messageId?: string;
  connectionId?: string;
  targetUserId?: number;
};

type WSResponse = {
  type: 'processing_started' | 'ai_response' | 'error' | 'response' | 'auth_success' | 'auth_failed' | 'pong' | 'ack';
  message?: string;
  content?: any;
  sessionId?: string;
  code?: number;
  messageId?: string;
};

// Message validation schemas
const voiceInputSchema = z.object({
  type: z.literal('voice_input'),
  audio: z.string(),
  language: z.string().optional(),
  sessionId: z.string().optional()
});

const transcriptSchema = z.object({
  type: z.literal('transcript'),
  content: z.string()
});

const authSchema = z.object({
  type: z.literal('auth'),
  token: z.string()
});

const ackSchema = z.object({
  type: z.literal('ack'),
  messageId: z.string()
});

const reconnectSchema = z.object({
  type: z.literal('reconnect'),
  connectionId: z.string(),
  token: z.string()
});

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_MESSAGES_PER_MINUTE: 60,
  VOICE_PROCESS_COOLDOWN: 2000,
  MAX_QUEUE_SIZE: 100,
  MAX_QUEUE_AGE: 24 * 60 * 60 * 1000,
  ACK_TIMEOUT: 30000,
  MAX_RECONNECT_ATTEMPTS: 3
};

// Custom error types
class WSError extends Error {
  constructor(message: string, public code: number = 4000) {
    super(message);
    this.name = 'WSError';
  }
}

// Custom WebSocket interface with additional properties
interface CustomWebSocket extends WebSocket {
  isAlive: boolean;
  messageCount: number;
  lastMessageTime: number;
  userId: string;
  isAuthenticated: boolean;
  connectionId: string;
  pendingAcks: Map<string, MessageAck>;
}

interface MessageAck {
  messageId: string;
  timestamp: number;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
}

interface QueuedMessage {
  timestamp: number;
  message: string;
  attempts: number;
  messageId: string;
  targetUserId?: number;
}

// Connection statistics
interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  messagesProcessed: number;
  errors: number;
  lastError?: string;
  reconnections: number;
}

// Connection state
interface ConnectionState {
  userId: number;
  lastSeen: number;
  isOnline: boolean;
  messageQueue: QueuedMessage[];
  pendingAcks: Map<string, MessageAck>;
}

// Connection state store
const connectionStates = new Map<string, ConnectionState>();

// Function to generate unique message ID
const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws',
    perMessageDeflate: true,
    clientTracking: true,
    maxPayload: 50 * 1024 * 1024 // 50MB max payload
  });

  // Connection statistics
  const stats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesProcessed: 0,
    errors: 0,
    reconnections: 0
  };

  // Setup heartbeat
  const heartbeat = (ws: CustomWebSocket) => {
    ws.isAlive = true;
  };

  // Connection handling
  wss.on('connection', (ws: CustomWebSocket) => {
    ws.isAlive = true;
    ws.messageCount = 0;
    ws.lastMessageTime = Date.now();
    ws.pendingAcks = new Map();
    stats.totalConnections++;
    stats.activeConnections++;

    console.log('Client connected to WebSocket');

    ws.on('pong', () => heartbeat(ws));

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      stats.errors++;
      stats.lastError = error.message;
    });

    ws.on('close', () => {
      stats.activeConnections--;
      console.log('Client disconnected from WebSocket');
    });
  });

  // Heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: CustomWebSocket) => {
      if (ws.isAlive === false) {
        stats.activeConnections--;
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
} 