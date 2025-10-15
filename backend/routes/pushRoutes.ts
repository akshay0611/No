import { Router } from 'express';
import { PushSubscription } from '../models/PushSubscription';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        error: 'INVALID_SUBSCRIPTION',
        message: 'Invalid subscription data'
      });
    }

    // Verify user matches authenticated user
    if (userId !== req.user?.userId) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'Cannot subscribe for another user'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.userId = userId;
      existingSubscription.keys = subscription.keys;
      existingSubscription.expirationTime = subscription.expirationTime || null;
      existingSubscription.lastUsed = new Date();
      await existingSubscription.save();

      console.log(`✅ Updated push subscription for user ${userId}`);
      return res.json({
        success: true,
        message: 'Subscription updated',
        subscriptionId: existingSubscription.id
      });
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime || null,
      createdAt: new Date(),
      lastUsed: new Date()
    });

    console.log(`✅ Created push subscription for user ${userId}`);
    res.json({
      success: true,
      message: 'Subscription created',
      subscriptionId: newSubscription.id
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      error: 'SUBSCRIPTION_FAILED',
      message: 'Failed to subscribe to push notifications'
    });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user?.userId;

    if (!endpoint) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Endpoint is required'
      });
    }

    // Delete subscription
    const result = await PushSubscription.deleteOne({
      userId,
      endpoint
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'SUBSCRIPTION_NOT_FOUND',
        message: 'Subscription not found'
      });
    }

    console.log(`✅ Deleted push subscription for user ${userId}`);
    res.json({
      success: true,
      message: 'Subscription deleted'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      error: 'UNSUBSCRIBE_FAILED',
      message: 'Failed to unsubscribe from push notifications'
    });
  }
});

/**
 * GET /api/push/subscriptions
 * Get all subscriptions for the authenticated user
 */
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const subscriptions = await PushSubscription.find({ userId }).select('-keys');

    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed
      }))
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch subscriptions'
    });
  }
});

export default router;
