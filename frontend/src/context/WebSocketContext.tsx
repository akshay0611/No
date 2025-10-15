import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { voiceNotificationService } from "../services/voiceNotificationService";
import type { WebSocketMessage } from "../types";

interface WebSocketContextType {
  connected: boolean;
  send: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';


    // Use VITE_WS_URL if available, otherwise construct from baseURL
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      wsUrl = baseURL.replace('http://', 'ws://').replace('https://', 'wss://');
    }
    wsUrl = wsUrl + '/ws';

    console.log('🔌 WebSocket Configuration:');
    console.log('  - Base URL:', baseURL);
    console.log('  - WebSocket URL:', wsUrl);
    console.log('  - User ID:', user.id);
    console.log('Attempting WebSocket connection...');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully to:', wsUrl);
      setConnected(true);

      // Authenticate with user ID
      const authMessage = {
        type: 'authenticate',
        userId: user.id,
      };
      console.log('Sending authentication message:', authMessage);
      ws.send(JSON.stringify(authMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message.type, message);

        switch (message.type) {
          case 'queue_join':
            // Voice notification for admin when new customer joins
            if (user?.role === 'salon_owner' && message.data) {
              console.log('🔔 Queue join event received:', message.data);

              const { customerName, serviceName } = message.data;

              console.log('✅ Triggering voice notification');
              console.log('Customer:', customerName, 'Service:', serviceName);

              voiceNotificationService.speakQueueJoin(customerName, serviceName);
            }

            // Invalidate queries to refresh queue data
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
            if (message.salonId) {
              queryClient.invalidateQueries({
                queryKey: ['/api/salons', message.salonId, 'queues']
              });
            }
            break;

          case 'queue_update':
          case 'queue_position_update':
            // Invalidate queue-related queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            queryClient.invalidateQueries({ queryKey: ['/api/salons'] });

            if (message.salonId) {
              queryClient.invalidateQueries({
                queryKey: ['/api/salons', message.salonId, 'queues']
              });
            }
            break;

          case 'queue_notification':
            // Store notification for NotificationOverlay to display
            window.dispatchEvent(new CustomEvent('queue_notification', { detail: message }));
            break;

          case 'customer_arrived':
            // Voice notification for admin when customer arrives
            if (user?.role === 'salon_owner' && message.data) {
              const customerName = message.data.userName || 'A customer';
              const verified = message.data.verified ? 'verified' : 'pending verification';
              voiceNotificationService.speakCustomerArrival(customerName, verified);
            }

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            if (message.salonId) {
              queryClient.invalidateQueries({
                queryKey: ['/api/salons', message.salonId, 'queues']
              });
            }
            break;

          case 'service_starting':
            // Invalidate queries and show toast
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            toast({
              title: "Service Starting",
              description: `Your service at ${message.salonName} is about to begin!`,
            });
            break;

          case 'service_completed':
            // Invalidate queries and show toast
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            toast({
              title: "Service Completed",
              description: `Your service at ${message.salonName} is complete. Thank you!`,
            });
            break;

          case 'no_show':
            // Invalidate queries and show toast
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            toast({
              title: "Marked as No-Show",
              description: message.data?.reason || "You were marked as no-show.",
              variant: "destructive",
            });
            break;

          case 'notification':
            // Show toast notification
            if (message.data?.title && message.data?.description) {
              toast({
                title: message.data.title,
                description: message.data.description,
              });
            }
            break;

          default:
            console.log('Unknown WebSocket message type:', message.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnected(false);

      // Attempt to reconnect after a delay if it wasn't a clean close
      if (!event.wasClean && user) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          // The useEffect will handle recreation
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.error('Failed to connect to:', wsUrl);
      console.error('WebSocket readyState:', ws.readyState);
      console.error('Make sure backend server is running on:', baseURL);
      setConnected(false);

      // Show user-friendly error
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please check if backend is running.",
        variant: "destructive",
      });
    };

    setSocket(ws);

    // Cleanup on unmount or user change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [user?.id]); // Only reconnect when user ID changes

  const send = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message:', message);
    }
  };

  const value: WebSocketContextType = {
    connected,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
