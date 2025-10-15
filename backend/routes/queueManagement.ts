import type { Express } from "express";
import { z } from 'zod';
import { queueService, reputationService } from '../services';
import { QueueModel, SalonModel, UserModel, CheckInLogModel, ServiceModel } from '../db';
import { wsManager } from '../websocket';
import { randomUUID } from 'crypto';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Check rate limit helper
const checkRateLimit = (key: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxAttempts) {
    return false;
  }

  limit.count++;
  return true;
};

// Validation schemas
const notifySchema = z.object({
  estimatedMinutes: z.number().int().refine(val => [5, 10, 15, 20].includes(val), {
    message: 'estimatedMinutes must be 5, 10, 15, or 20'
  }),
  message: z.string().optional()
});

const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(1000).optional()
});

const verifyArrivalSchema = z.object({
  confirmed: z.boolean(),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress', 'completed', 'no-show']),
  notes: z.string().optional()
});

export function registerQueueManagementRoutes(app: Express, authenticateToken: any) {
  
  /**
   * POST /api/queues/:id/notify
   * Get user details for direct WhatsApp message
   */
  app.post('/api/queues/:id/notify', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const queueId = req.params.id;
      
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Get salon to verify ownership
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify admin owns the salon
      if (salon.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to manage this salon' });
      }

      // Validate request body
      const { estimatedMinutes, message } = notifySchema.parse(req.body);

      // Get user details
      const user = await UserModel.findOne({ id: queue.userId });
      if (!user || !user.phone) {
        return res.status(400).json({ message: 'User phone number not available' });
      }

      // Get services for message
      const services = await ServiceModel.find({ 
        id: { $in: queue.serviceIds } 
      });

      // Update queue status
      queue.status = 'notified';
      queue.notifiedAt = new Date();
      queue.notificationMinutes = estimatedMinutes;
      await queue.save();

      // Send queue_notification WebSocket event to user
      const servicesData = services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration
      }));

      wsManager.sendQueueNotification(queue.userId, {
        queueId: queue.id,
        salonId: salon.id,
        salonName: salon.name,
        salonAddress: salon.address,
        estimatedMinutes,
        services: servicesData,
        salonLocation: {
          latitude: Number(salon.latitude),
          longitude: Number(salon.longitude)
        }
      });

      // Broadcast queue update to salon (for admin dashboard)
      wsManager.broadcastQueueUpdate(salon.id, {
        queueId: queue.id,
        status: 'notified',
        notifiedAt: queue.notifiedAt
      });

      // Return user details and message for direct WhatsApp
      const servicesList = services.map(s => s.name).join(', ');
      const whatsappMessage = message || `Hi ${user.name}! 👋\n\nYour turn is coming up at ${salon.name}!\n\n📋 Services: ${servicesList}\n⏰ Please arrive in: ${estimatedMinutes} minutes\n\nWe're ready for you! See you soon! 🎉`;

      console.log(`📱 Message prepared for ${user.phone} (queue ${queueId})`);
      console.log(`📢 WebSocket notification sent to user ${queue.userId}`);

      res.json({
        success: true,
        phoneNumber: user.phone,
        userName: user.name,
        message: whatsappMessage,
        notifiedAt: queue.notifiedAt.toISOString()
      });

    } catch (error: any) {
      console.error('Error in notify endpoint:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to prepare notification',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * POST /api/queues/:id/checkin
   * User check-in with location verification
   */
  app.post('/api/queues/:id/checkin', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate user authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const queueId = req.params.id;
      
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Verify user owns the queue
      if (queue.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to check in for this queue' });
      }

      // Check rate limiting (max 3 attempts per 5 minutes)
      const rateLimitKey = `checkin:${req.user.userId}`;
      if (!checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000)) {
        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many check-in attempts. Please wait 5 minutes.',
          retryable: true
        });
      }

      // Validate request body
      const body = checkInSchema.parse(req.body);
      
      // Build location data if provided
      let location;
      if (body.latitude !== undefined && body.longitude !== undefined) {
        location = {
          latitude: body.latitude,
          longitude: body.longitude,
          accuracy: body.accuracy
        };
      }

      // Call QueueService.processCheckIn
      const result = await queueService.processCheckIn(queueId, location);

      res.json({
        success: result.success,
        autoApproved: result.autoApproved,
        requiresConfirmation: result.requiresConfirmation,
        distance: result.distance,
        message: result.message,
        newStatus: result.newStatus
      });

    } catch (error: any) {
      console.error('Error in checkin endpoint:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to process check-in',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * POST /api/queues/:id/verify-arrival
   * Admin verify or reject arrival
   */
  app.post('/api/queues/:id/verify-arrival', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const queueId = req.params.id;
      
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Get salon to verify ownership
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify admin owns the salon
      if (salon.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to manage this salon' });
      }

      // Validate request body
      const { confirmed, notes } = verifyArrivalSchema.parse(req.body);

      // Update queue status
      const newStatus = confirmed ? 'nearby' : 'notified';
      queue.status = newStatus;
      
      if (confirmed) {
        queue.verifiedAt = new Date();
        queue.verificationMethod = 'admin_override';
        queue.verifiedBy = req.user.userId;
      }

      await queue.save();

      // Log admin action in CheckInLog
      await CheckInLogModel.create({
        id: randomUUID(),
        userId: queue.userId,
        queueId: queue.id,
        salonId: salon.id,
        timestamp: new Date(),
        userLocation: queue.checkInLocation,
        salonLocation: {
          latitude: Number(salon.latitude),
          longitude: Number(salon.longitude)
        },
        distance: queue.checkInDistance,
        method: 'admin_override',
        autoApproved: false,
        requiresConfirmation: false,
        verifiedBy: req.user.userId,
        success: confirmed,
        reason: notes || (confirmed ? 'Admin confirmed arrival' : 'Admin rejected arrival'),
        suspicious: false,
        suspiciousReasons: []
      });

      // Broadcast WebSocket update to all salon clients
      wsManager.broadcastQueueUpdate(salon.id, {
        type: 'arrival_verified',
        queueId: queue.id,
        status: newStatus,
        confirmed,
        verifiedBy: req.user.userId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        newStatus,
        message: confirmed ? 'Arrival confirmed' : 'Arrival rejected'
      });

    } catch (error: any) {
      console.error('Error in verify-arrival endpoint:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to verify arrival',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * PUT /api/queues/:id/status
   * Update queue status with state machine validation
   */
  app.put('/api/queues/:id/status', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const queueId = req.params.id;
      
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Validate request body
      const { status: newStatus, notes } = updateStatusSchema.parse(req.body);

      // Check authorization based on status change
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Admin actions: notify, start service, complete, no-show
      const adminActions = ['notified', 'in-progress', 'completed', 'no-show'];
      if (adminActions.includes(newStatus)) {
        if (salon.ownerId !== req.user.userId) {
          return res.status(403).json({ message: 'Not authorized to perform this action' });
        }
      }

      // User actions: check-in related statuses
      const userActions = ['pending_verification'];
      if (userActions.includes(newStatus)) {
        if (queue.userId !== req.user.userId) {
          return res.status(403).json({ message: 'Not authorized to perform this action' });
        }
      }

      // Call QueueService.updateStatus
      const updatedQueue = await queueService.updateStatus(queueId, newStatus, notes);

      // Count how many positions were updated (for completed/no-show)
      let positionsUpdated = 0;
      if (newStatus === 'completed' || newStatus === 'no-show') {
        const activeQueues = await QueueModel.find({
          salonId: queue.salonId,
          status: { $in: ['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress'] }
        });
        positionsUpdated = activeQueues.length;
      }

      res.json({
        success: true,
        queue: updatedQueue,
        positionsUpdated
      });

    } catch (error: any) {
      console.error('Error in update status endpoint:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors 
        });
      }

      if (error.message.includes('Invalid status transition')) {
        return res.status(400).json({
          error: 'INVALID_STATUS_TRANSITION',
          message: error.message,
          retryable: false
        });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to update status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * GET /api/salons/:salonId/pending-verifications
   * Get pending arrival verifications for admin
   */
  app.get('/api/salons/:salonId/pending-verifications', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const salonId = req.params.salonId;
      
      // Get salon to verify ownership
      const salon = await SalonModel.findOne({ id: salonId });
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify admin owns the salon
      if (salon.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to view this salon' });
      }

      // Query queues with status 'pending_verification'
      const pendingQueues = await QueueModel.find({
        salonId,
        status: 'pending_verification'
      }).sort({ checkInAttemptedAt: 1 }); // Oldest first

      // Build response with user details
      const pendingVerifications = await Promise.all(
        pendingQueues.map(async (queue) => {
          const user = await UserModel.findOne({ id: queue.userId });
          
          // Determine reason
          let reason: 'no_location' | 'too_far' | 'suspicious' = 'no_location';
          if (queue.checkInLocation) {
            if (queue.checkInDistance && queue.checkInDistance > 200) {
              reason = 'too_far';
            } else {
              reason = 'suspicious';
            }
          }

          return {
            queueId: queue.id,
            userName: user?.name || 'Unknown',
            userPhone: user?.phone || '',
            distance: queue.checkInDistance,
            checkInTime: queue.checkInAttemptedAt,
            reason
          };
        })
      );

      // Sort by priority (suspicious first, then by time)
      pendingVerifications.sort((a, b) => {
        if (a.reason === 'suspicious' && b.reason !== 'suspicious') return -1;
        if (a.reason !== 'suspicious' && b.reason === 'suspicious') return 1;
        const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return timeA - timeB;
      });

      res.json(pendingVerifications);

    } catch (error: any) {
      console.error('Error in pending-verifications endpoint:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get pending verifications',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * POST /api/queues/:id/call
   * Get user phone number for direct call
   */
  app.post('/api/queues/:id/call', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const queueId = req.params.id;
      
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Get salon to verify ownership
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify admin owns the salon
      if (salon.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to manage this salon' });
      }

      // Get user phone number
      const user = await UserModel.findOne({ id: queue.userId });
      if (!user || !user.phone) {
        return res.status(400).json({ message: 'User phone number not available' });
      }

      // Return phone number for direct call
      console.log(`📞 Call requested for ${user.phone} (queue ${queueId})`);

      res.json({
        success: true,
        phoneNumber: user.phone,
        userName: user.name,
        message: 'Phone number retrieved successfully'
      });

    } catch (error: any) {
      console.error('Error in call endpoint:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get phone number',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * GET /api/users/:userId/reputation
   * Get user reputation (admin only)
   */
  app.get('/api/users/:userId/reputation', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Only admins (salon owners) can view reputation
      if (req.user.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = req.params.userId;

      // Call ReputationService.getUserReputation
      const reputation = await reputationService.getUserReputation(userId);

      res.json(reputation);

    } catch (error: any) {
      console.error('Error in reputation endpoint:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get user reputation',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  /**
   * GET /api/users/:userId/checkin-history
   * Get user check-in history (admin only)
   */
  app.get('/api/users/:userId/checkin-history', authenticateToken, async (req: any, res: any) => {
    try {
      // Validate admin authorization
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Only admins (salon owners) can view check-in history
      if (req.user.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Query CheckInLog collection with pagination
      const logs = await CheckInLogModel.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const total = await CheckInLogModel.countDocuments({ userId });

      res.json({
        logs,
        total,
        limit,
        offset
      });

    } catch (error: any) {
      console.error('Error in checkin-history endpoint:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get check-in history',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  console.log('✅ Queue management routes registered');
}
