import { useState, useEffect, useRef, useCallback } from 'react';

type Message = {
  type: string;
  payload: any;
};

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Function to establish the WebSocket connection
  const connect = useCallback(() => {
    try {
      setError(null);
      
      // Determine the WebSocket URL based on the current protocol 
      // If no URL provided, connect to the same host but with ws/wss protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = url || `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      
      ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnecting(false);
        reconnectAttempts.current = 0;
      });
      
      ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
      });
      
      ws.addEventListener('close', (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Attempt to reconnect if not closed cleanly
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          setReconnecting(true);
          reconnectAttempts.current += 1;
          
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          setTimeout(connect, reconnectDelay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to connect after maximum reconnection attempts');
          setReconnecting(false);
        }
      });
      
      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
    }
  }, [url]);

  // Connect on component mount
  useEffect(() => {
    connect();
    
    // Cleanup function to close the WebSocket when the component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Send JSON message
  const sendJsonMessage = useCallback((type: string, payload: any = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      const message: Message = { type, payload };
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
    }
  }, []);

  // Send binary message
  const sendBinaryMessage = useCallback((data: ArrayBuffer, sessionId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      // If a sessionId is provided, prefix the binary data with the session ID
      if (sessionId) {
        // Convert session ID to binary prefix
        const sessionPrefix = `${sessionId}:`;
        const sessionPrefixBuffer = new TextEncoder().encode(sessionPrefix);
        
        // Create a new ArrayBuffer that includes both the prefix and the audio data
        const combinedBuffer = new ArrayBuffer(sessionPrefixBuffer.byteLength + data.byteLength);
        const combinedView = new Uint8Array(combinedBuffer);
        
        // Copy the session prefix and audio data into the combined buffer
        combinedView.set(sessionPrefixBuffer, 0);
        combinedView.set(new Uint8Array(data), sessionPrefixBuffer.byteLength);
        
        // Send the combined buffer
        wsRef.current.send(combinedBuffer);
      } else {
        // Send the binary data directly if no session ID
        wsRef.current.send(data);
      }
      return true;
    } catch (err) {
      console.error('Failed to send binary message:', err);
      return false;
    }
  }, []);

  return {
    isConnected,
    reconnecting,
    error,
    wsRef,
    sendJsonMessage,
    sendBinaryMessage
  };
}