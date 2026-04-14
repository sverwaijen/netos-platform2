import { Server as HTTPServer } from "http";
import WebSocket, { Server as WebSocketServer } from "ws";

export type WebSocketChannel =
  | "bookings"
  | "parking"
  | "sensors"
  | "kiosk-orders"
  | "signage";

export interface WebSocketMessage {
  channel: WebSocketChannel;
  data: unknown;
  timestamp: number;
}

export interface ClientInfo {
  id: string;
  channels: Set<WebSocketChannel>;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

interface ChannelBroadcast {
  subscribers: Map<string, ClientInfo>;
  messageCount: number;
  lastMessageTime: number;
}

export class WebSocketServerManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientInfo> = new Map();
  private channels: Map<WebSocketChannel, ChannelBroadcast> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageStats: Map<WebSocketChannel, number> = new Map();
  private reconnectionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.wss = new WebSocketServer({ server: httpServer });
    this.initializeChannels();
    this.setupConnectionHandler();
    this.startHeartbeat();
  }

  private initializeChannels(): void {
    const channelNames: WebSocketChannel[] = [
      "bookings",
      "parking",
      "sensors",
      "kiosk-orders",
      "signage",
    ];
    channelNames.forEach((channel) => {
      this.channels.set(channel, {
        subscribers: new Map(),
        messageCount: 0,
        lastMessageTime: 0,
      });
      this.messageStats.set(channel, 0);
    });
  }

  private setupConnectionHandler(): void {
    this.wss.on("connection", (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const clientInfo: ClientInfo = {
        id: clientId,
        channels: new Set(),
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0,
      };

      this.clients.set(clientId, clientInfo);

      ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(clientId, data, clientInfo);
      });

      ws.on("close", () => {
        this.handleDisconnection(clientId);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      });

      ws.on("pong", () => {
        if (this.clients.has(clientId)) {
          clientInfo.lastHeartbeat = Date.now();
        }
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "connected",
          clientId,
          timestamp: Date.now(),
        })
      );
    });
  }

  private handleMessage(
    clientId: string,
    data: WebSocket.Data,
    clientInfo: ClientInfo
  ): void {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "subscribe") {
        const channel = message.channel as WebSocketChannel;
        if (this.isValidChannel(channel)) {
          clientInfo.channels.add(channel);
          const channelInfo = this.channels.get(channel);
          if (channelInfo) {
            channelInfo.subscribers.set(clientId, clientInfo);
          }
        }
      } else if (message.type === "unsubscribe") {
        const channel = message.channel as WebSocketChannel;
        clientInfo.channels.delete(channel);
        const channelInfo = this.channels.get(channel);
        if (channelInfo) {
          channelInfo.subscribers.delete(clientId);
        }
      } else if (message.type === "ping") {
        const ws = this.getClientWebSocket(clientId);
        if (ws) {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  private handleDisconnection(clientId: string): void {
    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.channels.forEach((channel) => {
        const channelInfo = this.channels.get(channel);
        if (channelInfo) {
          channelInfo.subscribers.delete(clientId);
        }
      });
    }

    // Implement reconnection recovery with timeout
    const reconnectTimeout = setTimeout(() => {
      this.clients.delete(clientId);
      this.reconnectionTimeouts.delete(clientId);
    }, 30000); // 30 second window for reconnection

    this.reconnectionTimeouts.set(clientId, reconnectTimeout);
  }

  public broadcastToChannel(
    channel: WebSocketChannel,
    data: unknown
  ): void {
    if (!this.isValidChannel(channel)) {
      console.warn(`Invalid channel: ${channel}`);
      return;
    }

    const channelInfo = this.channels.get(channel);
    if (!channelInfo) return;

    const message = JSON.stringify({
      type: "message",
      channel,
      data,
      timestamp: Date.now(),
    });

    channelInfo.subscribers.forEach((clientInfo) => {
      const ws = this.getClientWebSocket(clientInfo.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    channelInfo.messageCount++;
    channelInfo.lastMessageTime = Date.now();
    const currentCount = this.messageStats.get(channel) || 0;
    this.messageStats.set(channel, currentCount + 1);
  }

  public getConnectionStats(): {
    connectedClients: number;
    channels: Record<
      WebSocketChannel,
      { subscribers: number; messagesPerMinute: number }
    >;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const channelStats: Record<
      WebSocketChannel,
      { subscribers: number; messagesPerMinute: number }
    > = {} as Record<
      WebSocketChannel,
      { subscribers: number; messagesPerMinute: number }
    >;

    this.channels.forEach((channelInfo, channelName) => {
      const messagesInLastMinute =
        channelInfo.lastMessageTime > oneMinuteAgo
          ? channelInfo.messageCount
          : 0;
      channelStats[channelName] = {
        subscribers: channelInfo.subscribers.size,
        messagesPerMinute: messagesInLastMinute,
      };
    });

    return {
      connectedClients: this.clients.size,
      channels: channelStats,
    };
  }

  public getChannelActivity(): Array<{
    channel: WebSocketChannel;
    subscribers: number;
    lastMessageTime: number;
    messageCount: number;
  }> {
    const activity: Array<{
      channel: WebSocketChannel;
      subscribers: number;
      lastMessageTime: number;
      messageCount: number;
    }> = [];

    this.channels.forEach((channelInfo, channelName) => {
      activity.push({
        channel: channelName,
        subscribers: channelInfo.subscribers.size,
        lastMessageTime: channelInfo.lastMessageTime,
        messageCount: channelInfo.messageCount,
      });
    });

    return activity.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((clientInfo, clientId) => {
        const ws = this.getClientWebSocket(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // 30 second heartbeat
  }

  private getClientWebSocket(clientId: string): WebSocket | null {
    let targetWs: WebSocket | null = null;
    this.wss.clients.forEach((ws) => {
      const wsClientId = (ws as any).clientId;
      if (wsClientId === clientId) {
        targetWs = ws;
      }
    });
    return targetWs;
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidChannel(channel: string): boolean {
    return this.channels.has(channel as WebSocketChannel);
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.reconnectionTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.wss.close();
  }
}

export function createWebSocketServer(
  httpServer: HTTPServer
): WebSocketServerManager {
  return new WebSocketServerManager(httpServer);
}
