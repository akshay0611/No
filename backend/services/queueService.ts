import { QueueModel, SalonModel, UserModel, ServiceModel, CheckInLogModel } from '../db';
import type { QueueStatus, Queue } from '../schema';
import verificationService from './verificationService';
import reputationService from './reputationService';
import notificationService from './notificationService';
import auditService from './auditService';
import wsManager from '../websocket';
import { randomUUID } from 'crypto';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface NotificationResult {
  success: boolean;
  whatsappSent: boolean;
  websocketSent: boolean;
  notifiedAt: Date;
}

interface CheckInResult {
  success: boolean;
  autoApproved: boolean;
  requiresConfirmation: boolean;
  distance?: number;
  message: string;
  newStatus: QueueStatus;
}

// Valid state transitions
const validTransitions: Record<QueueStatus, QueueStatus[]> = {
  waiting: ['notified', 'no-show'],
  notified: ['pending_verification', 'no-show'],
  pending_verification: ['nearby', 'notified', 'no-show'],
  nearby: ['in-progress', 'no-show'],
  'in-progress': ['completed', 'no-show'],
  completed: [],
  'no-show': []
};

class QueueService {
  /**
   * Notify user their turn is coming
   * @param queueId Queue ID
   * @param estimatedMinutes Minutes until user should arrive (5, 10, 15, 20)
   * @returns Notification result
   */
  async notifyUser(queueId: string, estimatedMinutes: number): Promise<NotificationResult> {
    try {
      // Get queue with details
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Get salon details
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        throw new Error('Salon not found');
      }

      // Get services
      const services = await ServiceModel.find({ 
        id: { $in: queue.serviceIds } 
      });

      // Update queue status
      queue.status = 'notified';
      queue.notifiedAt = new Date();
      queue.notificationMinutes = estimatedMinutes;
      await queue.save();

      // Create notification
      const notification = notificationService.createNotificationFromTemplate(
        'queue_notification',
        {
          salonName: salon.name,
          salonAddress: salon.address,
          estimatedMinutes,
          services: services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration
          })) as any
        }
      );

      // Add queue and salon data
      notification.data = {
        ...notification.data,
        queueId: queue.id,
        salonId: salon.id,
        salonLocation: {
          latitude: salon.latitude,
          longitude: salon.longitude
        }
      };

      // Send notification
      const result = await notificationService.sendNotification(queue.userId, notification);

      // Send queue_notification WebSocket event to user
      const websocketSent = wsManager.sendQueueNotification(queue.userId, {
        queueId: queue.id,
        salonId: salon.id,
        salonName: salon.name,
        salonAddress: salon.address,
        estimatedMinutes,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        salonLocation: {
          latitude: salon.latitude,
          longitude: salon.longitude
        }
      });

      // Broadcast queue update to salon
      wsManager.broadcastQueueUpdate(salon.id, {
        queueId: queue.id,
        status: 'notified',
        notifiedAt: queue.notifiedAt
      });

      console.log(`✅ Notified user ${queue.userId} for queue ${queueId}`);

      return {
        success: result.success,
        whatsappSent: result.whatsappSent,
        websocketSent: websocketSent || result.websocketSent,
        notifiedAt: queue.notifiedAt
      };
    } catch (error) {
      console.error('Error notifying user:', error);
      throw error;
    }
  }

  /**
   * Process user check-in with location verification
   * @param queueId Queue ID
   * @param location User's location (optional)
   * @returns Check-in result
   */
  async processCheckIn(
    queueId: string,
    location?: LocationData
  ): Promise<CheckInResult> {
    try {
      // Get queue
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Validate current status
      if (queue.status !== 'notified') {
        return {
          success: false,
          autoApproved: false,
          requiresConfirmation: false,
          message: 'Check-in not available at this time',
          newStatus: queue.status
        };
      }

      // Get salon location
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) {
        throw new Error('Salon not found');
      }

      const salonLocation = {
        latitude: Number(salon.latitude) || 0,
        longitude: Number(salon.longitude) || 0
      };

      // Update check-in attempt
      queue.checkInAttemptedAt = new Date();
      
      let verificationResult;
      let newStatus: QueueStatus;
      let message: string;

      // If location provided, verify it
      if (location) {
        queue.checkInLocation = location;
        
        verificationResult = await verificationService.verifyLocation(
          location,
          salonLocation,
          queue.userId
        );

        queue.checkInDistance = verificationResult.distance;

        // Log check-in attempt
        await this.logCheckInAttempt(queue, salon, location, verificationResult);

        if (!verificationResult.verified) {
          // Rejected - too far or banned
          message = verificationResult.reason;
          newStatus = 'notified';
        } else if (verificationResult.autoApproved) {
          // Auto-approved
          newStatus = 'nearby';
          queue.verifiedAt = new Date();
          queue.verificationMethod = 'gps_auto';
          message = 'Arrival verified automatically';
          
          // Update reputation
          await reputationService.updateReputation(queue.userId, 'successful_checkin');
          
          // Notify admin
          await this.notifyAdminOfArrival(queue, salon, verificationResult.distance, true);
        } else {
          // Requires admin confirmation
          newStatus = 'pending_verification';
          message = verificationResult.reason;
          
          // Notify admin for manual verification
          await this.notifyAdminOfArrival(queue, salon, verificationResult.distance, false);
        }
      } else {
        // No location provided - manual verification required
        newStatus = 'pending_verification';
        queue.verificationMethod = 'manual';
        message = 'Manual verification required';
        
        // Log check-in attempt without location
        await this.logCheckInAttempt(queue, salon, undefined, {
          verified: true,
          distance: 0,
          autoApproved: false,
          requiresReview: true,
          reason: 'No location provided'
        });
        
        // Notify admin
        await this.notifyAdminOfArrival(queue, salon, undefined, false);
      }

      // Update queue status
      queue.status = newStatus;
      await queue.save();

      // Broadcast update
      wsManager.broadcastQueueUpdate(salon.id, {
        queueId: queue.id,
        status: newStatus,
        checkInDistance: queue.checkInDistance
      });

      return {
        success: newStatus === 'nearby' || newStatus === 'pending_verification',
        autoApproved: newStatus === 'nearby',
        requiresConfirmation: newStatus === 'pending_verification',
        distance: queue.checkInDistance ?? undefined,
        message,
        newStatus
      };
    } catch (error) {
      console.error('Error processing check-in:', error);
      throw error;
    }
  }

  /**
   * Update queue status with state machine validation
   * @param queueId Queue ID
   * @param newStatus New status
   * @param notes Optional notes
   * @returns Updated queue
   */
  async updateStatus(
    queueId: string,
    newStatus: QueueStatus,
    notes?: string
  ): Promise<Queue> {
    try {
      const queue = await QueueModel.findOne({ id: queueId });
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Validate transition
      const validNextStates = validTransitions[queue.status];
      if (!validNextStates.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${queue.status} to ${newStatus}`
        );
      }

      const oldStatus = queue.status;
      queue.status = newStatus;

      // Update timestamps based on status
      switch (newStatus) {
        case 'nearby':
          queue.verifiedAt = new Date();
          break;
        case 'in-progress':
          queue.serviceStartedAt = new Date();
          // Send service_starting event to user
          await this.sendServiceStartingNotification(queue);
          break;
        case 'completed':
          queue.serviceCompletedAt = new Date();
          await reputationService.updateReputation(queue.userId, 'completed_service');
          // Send service_completed event to user
          await this.sendServiceCompletedNotification(queue);
          break;
        case 'no-show':
          queue.noShowMarkedAt = new Date();
          queue.noShowReason = notes || 'Did not arrive';
          await reputationService.updateReputation(queue.userId, 'no_show');
          // Send no_show event to user
          await this.sendNoShowNotification(queue);
          break;
      }

      await queue.save();

      // Log status transition for audit trail
      await auditService.logStatusTransition({
        queueId: queue.id,
        userId: queue.userId,
        salonId: queue.salonId,
        oldStatus,
        newStatus,
        actor: 'system', // This will be updated when we add admin tracking
        reason: notes,
        notes
      });

      // Recalculate positions if queue completed or no-show
      if (newStatus === 'completed' || newStatus === 'no-show') {
        await this.recalculatePositions(queue.salonId);
      }

      // Broadcast update
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (salon) {
        wsManager.broadcastQueueUpdate(salon.id, {
          queueId: queue.id,
          oldStatus,
          newStatus,
          timestamp: new Date()
        });
      }

      console.log(`✅ Updated queue ${queueId} status: ${oldStatus} -> ${newStatus}`);

      return queue.toObject() as any as Queue;
    } catch (error) {
      console.error('Error updating queue status:', error);
      throw error;
    }
  }

  /**
   * Recalculate all queue positions for a salon
   * @param salonId Salon ID
   */
  async recalculatePositions(salonId: string): Promise<void> {
    try {
      // Get all active queues for salon, sorted by timestamp
      const activeQueues = await QueueModel.find({
        salonId,
        status: { $in: ['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress'] }
      }).sort({ timestamp: 1 });

      // Update positions
      for (let i = 0; i < activeQueues.length; i++) {
        activeQueues[i].position = i + 1;
        
        // Recalculate estimated wait time based on position
        // Assume 30 minutes per service on average
        activeQueues[i].estimatedWaitTime = i * 30;
        
        await activeQueues[i].save();
      }

      console.log(`✅ Recalculated ${activeQueues.length} queue positions for salon ${salonId}`);

      // Send queue_position_update event to all users in this salon's queue
      wsManager.sendQueuePositionUpdate(
        salonId,
        activeQueues.map(q => ({
          id: q.id,
          userId: q.userId,
          position: q.position,
          status: q.status,
          estimatedWaitTime: q.estimatedWaitTime || 0
        }))
      );
    } catch (error) {
      console.error('Error recalculating positions:', error);
      throw error;
    }
  }

  /**
   * Process no-shows (background job)
   * Auto-mark users who don't respond within 20 minutes
   */
  async processNoShows(): Promise<void> {
    try {
      const twentyMinutesAgo = new Date();
      twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

      // Find queues notified more than 20 minutes ago
      const expiredQueues = await QueueModel.find({
        status: 'notified',
        notifiedAt: { $lte: twentyMinutesAgo }
      });

      console.log(`🔍 Found ${expiredQueues.length} expired queues to mark as no-show`);

      for (const queue of expiredQueues) {
        // Update to no-show
        queue.status = 'no-show';
        queue.noShowMarkedAt = new Date();
        queue.noShowReason = 'Did not respond within 20 minutes';
        await queue.save();

        // Update reputation
        await reputationService.updateReputation(queue.userId, 'no_show');

        // Send notification to user
        const salon = await SalonModel.findOne({ id: queue.salonId });
        if (salon) {
          const notification = notificationService.createNotificationFromTemplate(
            'no_show',
            {
              salonName: salon.name,
              reason: 'You did not arrive within the specified time'
            }
          );
          
          notification.data = {
            queueId: queue.id,
            salonId: salon.id
          };

          await notificationService.sendNotification(queue.userId, notification);

          // Send no_show WebSocket event to user
          wsManager.sendNoShow(queue.userId, {
            queueId: queue.id,
            salonName: salon.name,
            reason: queue.noShowReason
          });

          // Broadcast update
          wsManager.broadcastQueueUpdate(salon.id, {
            queueId: queue.id,
            status: 'no-show'
          });
        }

        // Recalculate positions
        await this.recalculatePositions(queue.salonId);
      }

      console.log(`✅ Processed ${expiredQueues.length} no-shows`);
    } catch (error) {
      console.error('Error processing no-shows:', error);
    }
  }

  /**
   * Log check-in attempt for audit trail
   */
  private async logCheckInAttempt(
    queue: any,
    salon: any,
    userLocation: LocationData | undefined,
    verificationResult: any
  ): Promise<void> {
    try {
      const timeSinceNotification = queue.notifiedAt 
        ? Date.now() - queue.notifiedAt.getTime()
        : undefined;

      await auditService.logCheckInAttempt({
        userId: queue.userId,
        queueId: queue.id,
        salonId: salon.id,
        userLocation,
        salonLocation: {
          latitude: Number(salon.latitude),
          longitude: Number(salon.longitude)
        },
        distance: verificationResult.distance,
        method: userLocation ? 'gps_auto' : 'manual',
        autoApproved: verificationResult.autoApproved,
        requiresConfirmation: verificationResult.requiresReview,
        success: verificationResult.verified,
        reason: verificationResult.reason,
        suspicious: !verificationResult.autoApproved && verificationResult.requiresReview,
        suspiciousReasons: !verificationResult.autoApproved ? [verificationResult.reason] : [],
        timeSinceNotification
      });
    } catch (error) {
      console.error('Error logging check-in attempt:', error);
    }
  }

  /**
   * Notify admin of customer arrival
   */
  private async notifyAdminOfArrival(
    queue: any,
    salon: any,
    distance: number | undefined,
    autoApproved: boolean
  ): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: queue.userId });
      if (!user) return;

      // Send customer_arrived WebSocket event to all admin connections for this salon
      wsManager.sendCustomerArrivedToSalon(salon.id, {
        queueId: queue.id,
        userId: user.id,
        userName: user.name || 'Unknown',
        userPhone: user.phone || 'N/A',
        verified: autoApproved,
        distance,
        requiresConfirmation: !autoApproved
      });

      console.log(`📢 Notified admin of arrival for queue ${queue.id}`);
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  /**
   * Send service_starting notification to user
   */
  private async sendServiceStartingNotification(queue: any): Promise<void> {
    try {
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) return;

      const services = await ServiceModel.find({ 
        id: { $in: queue.serviceIds } 
      });

      const estimatedTime = services.reduce((total, service) => total + service.duration, 0);

      wsManager.sendServiceStarting(queue.userId, {
        queueId: queue.id,
        salonName: salon.name,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          duration: s.duration
        })),
        estimatedTime
      });

      console.log(`📢 Sent service_starting notification for queue ${queue.id}`);
    } catch (error) {
      console.error('Error sending service_starting notification:', error);
    }
  }

  /**
   * Send service_completed notification to user
   */
  private async sendServiceCompletedNotification(queue: any): Promise<void> {
    try {
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) return;

      const services = await ServiceModel.find({ 
        id: { $in: queue.serviceIds } 
      });

      wsManager.sendServiceCompleted(queue.userId, {
        queueId: queue.id,
        salonName: salon.name || 'Salon',
        services: services.map(s => ({
          id: s.id,
          name: s.name || 'Service',
          price: s.price || 0
        })),
        totalPrice: queue.totalPrice || 0
      });

      console.log(`📢 Sent service_completed notification for queue ${queue.id}`);
    } catch (error) {
      console.error('Error sending service_completed notification:', error);
    }
  }

  /**
   * Send no_show notification to user
   */
  private async sendNoShowNotification(queue: any): Promise<void> {
    try {
      const salon = await SalonModel.findOne({ id: queue.salonId });
      if (!salon) return;

      wsManager.sendNoShow(queue.userId, {
        queueId: queue.id,
        salonName: salon.name,
        reason: queue.noShowReason || 'Did not arrive'
      });

      console.log(`📢 Sent no_show notification for queue ${queue.id}`);
    } catch (error) {
      console.error('Error sending no_show notification:', error);
    }
  }
}

export default new QueueService();
