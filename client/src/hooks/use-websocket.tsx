import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    const baseDelay = 1000; // 1 second

    const connect = () => {
      try {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          setError(null);
          setReconnecting(false);
          reconnectAttemptsRef.current = 0;
        };

        ws.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
          setIsConnected(false);
          wsRef.current = null;

          // Don't attempt to reconnect if the connection was closed normally
          if (event.code === 1000 || event.code === 1001) {
            return;
          }

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            setReconnecting(true);
            const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), 10000);
            console.log(`Attempting to reconnect in ${delay}ms...`);
            reconnectTimeout = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            setError("Failed to connect to WebSocket server after multiple attempts");
            setReconnecting(false);
          }
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          // Don't set error here as it will be handled by onclose
        };

        // Set up ping/pong for connection keep-alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        return () => {
          clearInterval(pingInterval);
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setError("Failed to create WebSocket connection");
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [url]);

  const sendBinaryMessage = (data: ArrayBuffer): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return false;
    }

    try {
      wsRef.current.send(data);
      return true;
    } catch (err) {
      console.error("Error sending WebSocket message:", err);
      return false;
    }
  };

  return { wsRef, isConnected, error, reconnecting, sendBinaryMessage };
} 