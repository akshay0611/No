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

  // Broadcast when a new customer joins the queue
  broadcastQueueJoin(salonId: string, queueData: any) {
    const message = JSON.stringify({
      type: 'queue_join',
      salonId,
      data: queueData,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Broadcasting queue_join to ${this.clients.size} connected clients`);
    
    let sentCount = 0;
    this.clients.forEach((client, userId) => {
      console.log(`  Client ${userId}: readyState=${client.readyState}, authenticated=${client.isAuthenticated}`);
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(message);
        sentCount++;
        console.log(`  ✅ Sent to ${userId}`);
      }
    });

    console.log(`🔔 Broadcasted queue_join event to ${sentCount} clients for salon: ${salonId}`, queueData);
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

  // Send queue_notification event to specific user
  sendQueueNotification(
    userId: string,
    data: {
      queueId: string;
      salonId: string;
      salonName: string;
      salonAddress: string;
      estimatedMinutes: number;
      services: Array<{ id: string; name: string; price: number; duration: number }>;
      salonLocation: { latitude: number; longitude: number };
    }
  ): boolean {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'queue_notification',
        userId,
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Sent queue_notification to user: ${userId}`);
      return true;
    }
    
    console.log(`⚠️ User ${userId} not connected for queue_notification`);
    return false;
  }

  // Send customer_arrived event to all admin connections for a salon
  sendCustomerArrivedToSalon(
    salonId: string,
    data: {
      queueId: string;
      userId: string;
      userName: string;
      userPhone: string;
      verified: boolean;
      distance?: number;
      requiresConfirmation: boolean;
    }
  ): void {
    const message = JSON.stringify({
      type: 'customer_arrived',
      salonId,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all connected clients (admins will filter by salon)
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(message);
      }
    });

    console.log(`📢 Sent customer_arrived event for salon: ${salonId}`);
  }

  // Send queue_position_update event to all users in a salon's queue
  sendQueuePositionUpdate(
    salonId: string,
    queues: Array<{
      id: string;
      userId: string;
      position: number;
      status: string;
      estimatedWaitTime: number;
    }>
  ): void {
    const message = JSON.stringify({
      type: 'queue_position_update',
      salonId,
      queues,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all connected clients
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(message);
      }
    });

    console.log(`📢 Sent queue_position_update for salon: ${salonId}`);
  }

  // Send service_starting event to specific user
  sendServiceStarting(
    userId: string,
    data: {
      queueId: string;
      salonName: string;
      services: Array<{ id: string; name: string; duration: number }>;
      estimatedTime: number;
    }
  ): boolean {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'service_starting',
        userId,
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Sent service_starting to user: ${userId}`);
      return true;
    }
    
    console.log(`⚠️ User ${userId} not connected for service_starting`);
    return false;
  }

  // Send service_completed event to specific user
  sendServiceCompleted(
    userId: string,
    data: {
      queueId: string;
      salonName: string;
      services: Array<{ id: string; name: string; price: number }>;
      totalPrice: number;
    }
  ): boolean {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'service_completed',
        userId,
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Sent service_completed to user: ${userId}`);
      return true;
    }
    
    console.log(`⚠️ User ${userId} not connected for service_completed`);
    return false;
  }

  // Send no_show event to specific user
  sendNoShow(
    userId: string,
    data: {
      queueId: string;
      salonName: string;
      reason: string;
    }
  ): boolean {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'no_show',
        userId,
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Sent no_show to user: ${userId}`);
      return true;
    }
    
    console.log(`⚠️ User ${userId} not connected for no_show`);
    return false;
  }

  // Get the number of active WebSocket connections
  getConnectionCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
export default wsManager;
