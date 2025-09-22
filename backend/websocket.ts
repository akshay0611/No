import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface WebSocketMessage {
  type: string;
  userId?: string;
  salonId?: string;
  data?: any;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('🔌 New WebSocket connection');

      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          console.log(`🔌 WebSocket disconnected for user: ${ws.userId}`);
        }
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'WebSocket connection established' 
      }));
    });

    console.log('🚀 WebSocket server initialized on /ws');
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'authenticate':
        this.authenticateClient(ws, message);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        console.log('🔄 Unknown WebSocket message type:', message.type);
    }
  }

  private authenticateClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      if (!message.userId) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'User ID required' 
        }));
        return;
      }

      // Store authenticated client
      ws.userId = message.userId;
      ws.isAuthenticated = true;
      this.clients.set(message.userId, ws);

      console.log(`✅ WebSocket authenticated for user: ${message.userId}`);
      
      ws.send(JSON.stringify({ 
        type: 'authenticated', 
        message: 'Successfully authenticated' 
      }));
    } catch (error) {
      console.error('❌ Authentication error:', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Authentication failed' 
      }));
    }
  }

  // Broadcast queue update to all connected clients
  broadcastQueueUpdate(salonId: string, data: any) {
    const message = JSON.stringify({
      type: 'queue_update',
      salonId,
      data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(message);
      }
    });

    console.log(`📢 Broadcasted queue update for salon: ${salonId}`);
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, title: string, description: string) {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: { title, description },
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Sent notification to user: ${userId}`);
    }
  }

  // Send notification to all users in a salon's queue
  sendNotificationToSalon(salonId: string, title: string, description: string) {
    const message = JSON.stringify({
      type: 'notification',
      salonId,
      data: { title, description },
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(message);
      }
    });

    console.log(`📢 Sent notification to salon: ${salonId}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    const client = this.clients.get(userId);
    return client ? client.readyState === WebSocket.OPEN : false;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
export default wsManager;
