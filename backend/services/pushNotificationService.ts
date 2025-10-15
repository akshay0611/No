import webpush from 'web-push';

// VAPID keys for web push (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@smartq.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push configured with VAPID keys');
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
  console.warn('   Generate keys with: npx web-push generate-vapid-keys');
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  // Store subscriptions in memory (in production, use database)
  private subscriptions: Map<string, PushSubscription> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize service by loading subscriptions from database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const { PushSubscription: PushSubscriptionModel } = await import('../models/PushSubscription');
      const subscriptions = await PushSubscriptionModel.find({});
      
      subscriptions.forEach(sub => {
        if (sub.keys) {
          this.subscriptions.set(sub.userId, {
            endpoint: sub.endpoint,
            keys: sub.keys
          });
        }
      });
      
      console.log(`✅ Loaded ${subscriptions.length} push subscriptions from database`);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to load push subscriptions:', error);
    }
  }

  /**
   * Save a push subscription for a user
   */
  saveSubscription(userId: string, subscription: PushSubscription): void {
    this.subscriptions.set(userId, subscription);
    console.log(`💾 Saved push subscription for user: ${userId}`);
  }

  /**
   * Remove a push subscription for a user
   */
  removeSubscription(userId: string): void {
    this.subscriptions.delete(userId);
    console.log(`🗑️  Removed push subscription for user: ${userId}`);
  }

  /**
   * Get subscription for a user
   */
  getSubscription(userId: string): PushSubscription | undefined {
    return this.subscriptions.get(userId);
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    const subscription = this.subscriptions.get(userId);
    
    if (!subscription) {
      console.log(`⚠️  No push subscription found for user: ${userId}`);
      return false;
    }

    try {
      await webpush.sendNotification(
        subscription as any,
        JSON.stringify(payload)
      );
      
      console.log(`📤 Push notification sent to user: ${userId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send push notification to user ${userId}:`, error.message);
      
      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`🗑️  Removing invalid subscription for user: ${userId}`);
        this.removeSubscription(userId);
      }
      
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: NotificationPayload): Promise<number> {
    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    const results = await Promise.all(promises);
    const successCount = results.filter(success => success).length;
    
    console.log(`📤 Sent push notifications to ${successCount}/${userIds.length} users`);
    return successCount;
  }

  /**
   * Send queue join notification to salon owner
   */
  async sendQueueJoinNotification(
    ownerId: string,
    customerName: string,
    serviceName: string,
    salonName: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '🔔 New Customer in Queue',
      body: `${customerName} joined the queue for ${serviceName}`,
      icon: '/loadlogo.png',
      badge: '/loadlogo.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'queue-join',
      requireInteraction: true,
      data: {
        type: 'queue_join',
        customerName,
        serviceName,
        salonName,
        url: '/dashboard'
      },
      actions: [
        {
          action: 'view',
          title: 'View Queue'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    return this.sendToUser(ownerId, payload);
  }

  /**
   * Get statistics
   */
  getStats(): { totalSubscriptions: number; userIds: string[] } {
    return {
      totalSubscriptions: this.subscriptions.size,
      userIds: Array.from(this.subscriptions.keys())
    };
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
