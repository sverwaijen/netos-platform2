import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketChannel =
  | "bookings"
  | "parking"
  | "sensors"
  | "kiosk-orders"
  | "signage";

export interface WebSocketMessage {
  type: string;
  channel?: WebSocketChannel;
  data?: unknown;
  timestamp?: number;
  clientId?: string;
}

export interface WebSocketStatus {
  connected: boolean;
  clientId: string | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

type ChannelMessages = {
  [key in WebSocketChannel]?: WebSocketMessage | null;
};

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket(
  channels: WebSocketChannel[] = []
): WebSocketStatus & { lastMessagesByChannel: ChannelMessages; subscribe: (channel: WebSocketChannel) => void; unsubscribe: (channel: WebSocketChannel) => void } {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    clientId: null,
    lastMessage: null,
    reconnectAttempts: 0,
  });

  const [lastMessagesByChannel, setLastMessagesByChannel] =
    useState<ChannelMessages>({});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}`;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setStatus((prev) => ({
          ...prev,
          connected: true,
          reconnectAttempts: 0,
        }));

        // Subscribe to channels
        channels.forEach((channel: any) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "subscribe",
                channel,
              })
            );
          }
        });

        // Start ping interval for connection keep-alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === "connected") {
            setStatus((prev) => ({
              ...prev,
              clientId: message.clientId || null,
            }));
          } else if (message.type === "message" && message.channel) {
            setStatus((prev) => ({
              ...prev,
              lastMessage: message,
            }));
            setLastMessagesByChannel((prev) => ({
              ...prev,
              [message.channel as WebSocketChannel]: message,
            }));
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus((prev) => ({
          ...prev,
          connected: false,
        }));

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnection with exponential backoff
        if (status.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(
            () => {
              setStatus((prev) => ({
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1,
              }));
              connect();
            },
            RECONNECT_DELAY * Math.pow(2, status.reconnectAttempts)
          );
        } else {
          console.error(
            "Max reconnection attempts reached. WebSocket will not reconnect."
          );
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setStatus((prev) => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));
    }
  }, [channels, status.reconnectAttempts]);

  const subscribe = useCallback((channel: WebSocketChannel) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "subscribe",
          channel,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((channel: WebSocketChannel) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "unsubscribe",
          channel,
        })
      );
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    ...status,
    lastMessagesByChannel,
    subscribe: subscribe as any,
    unsubscribe: unsubscribe as any,
  };
}
