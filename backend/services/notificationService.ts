import { NotificationLogModel, UserModel } from '../db';
import type { NotificationType, Service } from '../schema';
import whatsappService from '../whatsappService';
import wsManager from '../websocket';
import auditService from './auditService';
import { randomUUID } from 'crypto';
import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription';
import {
  executeWhatsAppWithResilience,
  executeWebSocketWithResilience,
  executePushWithResilience,
  websocketMessageQueue
} from '../utils/resilience';

interface Notification {
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}

interface NotificationResult {
  success: boolean;
  whatsappSent: boolean;
  websocketSent: boolean;
  pushSent: boolean;
  error?: string;
}

interface NotificationTemplateData {
  salonName: string;
  salonAddress?: string;
  estimatedMinutes?: number;
  services?: Service[];
  userName?: string;
  totalPrice?: number;
  reason?: string;
}

class NotificationService {
  /**
   * Send notification via all available channels
   * @param userId User ID to send notification to
   * @param notification Notification details
   * @returns Result of notification delivery
   */
  async sendNotification(
    userId: string,
    notification: Notification
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      whatsappSent: false,
      websocketSent: false,
      pushSent: false
    };

    try {
      // Get user details
      const user = await UserModel.findOne({ id: userId });
      if (!user) {
        result.error = 'User not found';
        return result;
      }

      // Send via WhatsApp if phone number available
      if (user.phone) {
        result.whatsappSent = await this.sendWhatsApp(
          user.phone,
          notification.body,
          user.name || 'User'
        );
      }

      // Send via WebSocket
      result.websocketSent = await this.sendWebSocket(userId, notification);

      // Send push notification (PWA)
      result.pushSent = await this.sendPushNotification(userId, notification);

      // Consider success if at least one channel worked
      result.success = result.whatsappSent || result.websocketSent || result.pushSent;

      // Log notification
      await this.logNotification(userId, notification, result);

      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Send WhatsApp message using existing Twilio integration with retry logic
   * @param phoneNumber User's phone number
   * @param message Message to send
   * @param userName User's name
   * @returns True if sent successfully
   */
  async sendWhatsApp(
    phoneNumber: string,
    message: string,
    userName: string = 'User'
  ): Promise<boolean> {
    const result = await executeWhatsAppWithResilience(async () => {
      // Use existing WhatsApp service (currently sends OTP, we'll use same method)
      const sent = await whatsappService.sendOTP(phoneNumber, message, userName);
      
      if (!sent) {
        throw new Error('WhatsApp service returned false');
      }
      
      return sent;
    });

    if (result.success) {
      console.log(`📱 WhatsApp sent to ${phoneNumber}`);
      return true;
    } else {
      console.log(`❌ WhatsApp failed for ${phoneNumber}: ${result.error}`);
      return false;
    }
  }

  /**
   * Send WebSocket notification using existing WebSocket manager with resilience
   * @param userId User ID
   * @param notification Notification data
   * @returns True if sent successfully
   */
  async sendWebSocket(userId: string, notification: Notification): Promise<boolean> {
    const result = await executeWebSocketWithResilience(async () => {
      // Check if user is connected
      if (!wsManager.isUserConnected(userId)) {
        // Queue message for delivery when user reconnects
        websocketMessageQueue.enqueue(userId, notification);
        console.log(`⚠️ User ${userId} not connected, message queued`);
        return false;
      }

      // Send notification
      wsManager.sendNotificationToUser(userId, notification.title, notification.body);
      
      // Clear any queued messages for this user since they're connected
      websocketMessageQueue.removeMessagesForUser(userId);
      
      return true;
    });

    if (result.success && result.result) {
      console.log(`🔔 WebSocket notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`❌ WebSocket failed for user ${userId}: ${result.error}`);
      return false;
    }
  }

  /**
   * Send push notification for PWA with retry logic
   * @param userId User ID
   * @param notification Notification data
   * @returns True if sent successfully
   */
  async sendPushNotification(
    userId: string,
    notification: Notification
  ): Promise<boolean> {
    const result = await executePushWithResilience(async () => {
      // Configure VAPID keys
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@smartq.com';

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('⚠️ VAPID keys not configured, skipping push notification');
        return false;
      }

      // Set VAPID details
      webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
      );

      // Get user's push subscriptions
      const subscriptions = await PushSubscription.find({ userId });

      if (subscriptions.length === 0) {
        console.log(`⚠️ No push subscriptions found for user ${userId}`);
        return false;
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
          ...notification.data,
          url: this.getNotificationUrl(notification.type, notification.data)
        },
        tag: `smartq-${notification.type}`,
        requireInteraction: notification.priority === 'high',
        actions: this.getNotificationActions(notification.type)
      });

      // Send to all subscriptions
      let sentCount = 0;
      const failedSubscriptions: string[] = [];

      for (const subscription of subscriptions) {
        try {
          if (!subscription.keys) {
            console.warn('⚠️ Subscription missing keys, skipping');
            continue;
          }

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
              }
            },
            payload
          );

          // Update last used timestamp
          subscription.lastUsed = new Date();
          await subscription.save();

          sentCount++;
          console.log(`📲 Push notification sent to subscription ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
          console.error('Push notification send error:', error);

          // Handle expired or invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️ Removing expired subscription ${subscription.endpoint.substring(0, 50)}...`);
            failedSubscriptions.push(subscription.id);
          } else {
            // Rethrow other errors for retry logic
            throw error;
          }
        }
      }

      // Clean up failed subscriptions
      if (failedSubscriptions.length > 0) {
        await PushSubscription.deleteMany({ _id: { $in: failedSubscriptions } });
      }

      return sentCount > 0;
    });

    if (result.success && result.result) {
      console.log(`📲 Push notifications sent to user ${userId}`);
      return true;
    } else {
      console.log(`❌ Push notification failed for user ${userId}: ${result.error}`);
      return false;
    }
  }

  /**
   * Get notification URL based on type
   */
  private getNotificationUrl(type: NotificationType, data: any): string {
    switch (type) {
      case 'queue_notification':
      case 'arrival_verified':
      case 'service_starting':
      case 'service_completed':
      case 'no_show':
        return data?.queueId ? `/queue?id=${data.queueId}` : '/queue';
      case 'position_update':
        return '/queue';
      default:
        return '/';
    }
  }

  /**
   * Get notification actions based on type
   */
  private getNotificationActions(type: NotificationType): Array<{ action: string; title: string }> {
    switch (type) {
      case 'queue_notification':
        return [
          { action: 'view', title: 'View Queue' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
      case 'service_starting':
        return [
          { action: 'view', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
      default:
        return [];
    }
  }

  /**
   * Log notification delivery to database
   */
  private async logNotification(
    userId: string,
    notification: Notification,
    result: NotificationResult
  ): Promise<void> {
    try {
      await auditService.logNotificationDelivery({
        userId,
        queueId: notification.data?.queueId || '',
        salonId: notification.data?.salonId || '',
        type: notification.type,
        title: notification.title,
        body: notification.body,
        channels: {
          whatsapp: {
            sent: result.whatsappSent,
            sentAt: result.whatsappSent ? new Date() : undefined,
            error: result.whatsappSent ? undefined : 'Failed to send'
          },
          websocket: {
            sent: result.websocketSent,
            sentAt: result.websocketSent ? new Date() : undefined,
            delivered: result.websocketSent
          },
          push: {
            sent: result.pushSent,
            sentAt: result.pushSent ? new Date() : undefined,
            error: result.pushSent ? undefined : 'Not implemented'
          }
        }
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Deliver queued messages to a user when they reconnect
   * @param userId User ID
   */
  async deliverQueuedMessages(userId: string): Promise<void> {
    const queuedMessages = websocketMessageQueue.getMessagesForUser(userId);
    
    if (queuedMessages.length === 0) {
      return;
    }

    console.log(`📬 Delivering ${queuedMessages.length} queued messages to user ${userId}`);

    for (const notification of queuedMessages) {
      try {
        await this.sendWebSocket(userId, notification);
      } catch (error) {
        console.error('Error delivering queued message:', error);
      }
    }

    // Clear delivered messages
    websocketMessageQueue.removeMessagesForUser(userId);
  }

  /**
   * Create notification from template
   */
  createNotificationFromTemplate(
    type: NotificationType,
    data: NotificationTemplateData
  ): Notification {
    const templates: Record<NotificationType, (data: NotificationTemplateData) => Notification> = {
      queue_notification: (d) => ({
        type: 'queue_notification',
        title: `Your turn is coming up at ${d.salonName}!`,
        body: `Please arrive in ${d.estimatedMinutes} minutes at ${d.salonAddress}. Services: ${d.services?.map(s => s.name).join(', ')}`,
        priority: 'high',
        data
      }),
      
      arrival_verified: (d) => ({
        type: 'arrival_verified',
        title: 'Arrival Confirmed',
        body: `Your arrival at ${d.salonName} has been verified. Please wait to be called.`,
        priority: 'normal',
        data
      }),
      
      service_starting: (d) => ({
        type: 'service_starting',
        title: 'Your service is starting',
        body: `Please proceed to ${d.salonName}. Your service is about to begin.`,
        priority: 'high',
        data
      }),
      
      service_completed: (d) => ({
        type: 'service_completed',
        title: 'Service Completed',
        body: `Thank you for visiting ${d.salonName}! Total: ₹${d.totalPrice}. Please rate your experience.`,
        priority: 'normal',
        data
      }),
      
      no_show: (d) => ({
        type: 'no_show',
        title: 'Missed Appointment',
        body: `You were marked as no-show at ${d.salonName}. ${d.reason || 'Please arrive on time for future appointments.'}`,
        priority: 'normal',
        data
      }),
      
      position_update: (d) => ({
        type: 'position_update',
        title: 'Queue Position Updated',
        body: `Your position in the queue at ${d.salonName} has been updated.`,
        priority: 'low',
        data
      })
    };

    return templates[type](data);
  }
}

export default new NotificationService();
