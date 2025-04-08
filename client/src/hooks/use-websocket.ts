import { useState, useEffect, useCallback, useRef } from 'react';

type Message = {
  type: string;
  payload: any;
};

interface WebSocketConfig {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(url: string, config?: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const maxReconnectAttempts = 5;
  
  // Connect to WebSocket with automatic reconnection
  useEffect(() => {
    // Calculate actual WebSocket URL
    const actualUrl = url.startsWith('ws://') || url.startsWith('wss://') 
      ? url 
      : `ws://${window.location.hostname}:5000/ws`;
    
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Clear any pending reconnect timers
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Create new WebSocket connection
    const ws = new WebSocket(actualUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      setReconnectAttempt(0);
      config?.onOpen?.();
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
      setIsConnected(false);
      config?.onClose?.();
      
      // Only attempt to reconnect if not a normal closure and under max attempts
      if (event.code !== 1000 && event.code !== 1001 && reconnectAttempt < maxReconnectAttempts) {
        // Exponential backoff for reconnect (max 30 seconds)
        const delay = Math.min(1000 * (Math.pow(2, reconnectAttempt) + Math.random()), 30000);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
        }, delay);
      } else if (reconnectAttempt >= maxReconnectAttempts) {
        setError('Maximum reconnection attempts reached. Please refresh the page.');
      }
    };
    
    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to WebSocket server');
      config?.onError?.(event);
    };
    
    wsRef.current = ws;
    
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      ws.close();
      wsRef.current = null;
    };
  }, [url, reconnectAttempt, config]);
  
  // Send a JSON message through WebSocket
  const sendJsonMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: Message = { type, payload };
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      setError('WebSocket is not connected');
      return false;
    }
  }, []);
  
  // Send a binary message (for audio) through WebSocket
  const sendBinaryMessage = useCallback((data: ArrayBuffer, sessionId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        // If session ID is provided, prefix it to the binary data
        if (sessionId) {
          const encoder = new TextEncoder();
          const sessionIdBytes = encoder.encode(`${sessionId}:`);
          
          // Create a new ArrayBuffer with room for both the session ID and the audio data
          const combinedBuffer = new ArrayBuffer(sessionIdBytes.byteLength + data.byteLength);
          const combinedArray = new Uint8Array(combinedBuffer);
          
          // Add session ID bytes and audio data to the combined buffer
          combinedArray.set(sessionIdBytes, 0);
          combinedArray.set(new Uint8Array(data), sessionIdBytes.byteLength);
          
          wsRef.current.send(combinedBuffer);
        } else {
          // Send data directly if no session ID
          wsRef.current.send(data);
        }
        return true;
      } catch (err) {
        console.error('Failed to send binary message:', err);
        setError('Failed to send audio data');
        return false;
      }
    } else {
      setError('WebSocket is not connected');
      return false;
    }
  }, []);
  
  return { 
    wsRef, 
    isConnected, 
    error, 
    sendJsonMessage, 
    sendBinaryMessage,
    reconnecting: reconnectAttempt > 0
  };
}