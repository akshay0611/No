import { CheckInLogModel, NotificationLogModel, QueueModel } from '../db';
import { randomUUID } from 'crypto';
import type { QueueStatus, NotificationType } from '../schema';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface StatusTransitionLog {
  queueId: string;
  userId: string;
  salonId: string;
  oldStatus: QueueStatus;
  newStatus: QueueStatus;
  actor: string; // userId or 'system'
  actorRole?: 'customer' | 'salon_owner' | 'system';
  reason?: string;
  notes?: string;
}

interface CheckInAttemptLog {
  userId: string;
  queueId: string;
  salonId: string;
  userLocation?: LocationData;
  salonLocation: LocationData;
  distance?: number;
  method: 'gps_auto' | 'manual' | 'admin_override';
  autoApproved: boolean;
  requiresConfirmation: boolean;
  verifiedBy?: string;
  success: boolean;
  reason?: string;
  suspicious: boolean;
  suspiciousReasons?: string[];
  timeSinceNotification?: number;
}

interface AdminActionLog {
  adminId: string;
  queueId: string;
  salonId: string;
  action: string;
  details?: any;
  timestamp: Date;
}

interface NotificationDeliveryLog {
  userId: string;
  queueId: string;
  salonId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels: {
    whatsapp: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
    websocket: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
    };
    push?: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
  };
}

class AuditService {
  /**
   * Log queue status transition
   * @param log Status transition details
   */
  async logStatusTransition(log: StatusTransitionLog): Promise<void> {
    try {
      console.log(`📝 [AUDIT] Status transition: Queue ${log.queueId} | ${log.oldStatus} → ${log.newStatus} | Actor: ${log.actor}`);
      
      // Store in a dedicated collection or extend existing queue document
      // For now, we'll log to console and could extend to a StatusTransitionLog collection
      // This provides an audit trail for all status changes
      
      // You could create a separate StatusTransitionLog model if needed
      // For this implementation, we'll ensure all transitions are logged via console
      // and tracked in the queue document's history
      
    } catch (error) {
      console.error('Error logging status transition:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Log check-in attempt with full details
   * @param log Check-in attempt details
   */
  async logCheckInAttempt(log: CheckInAttemptLog): Promise<void> {
    try {
      const checkInLog = await CheckInLogModel.create({
        id: randomUUID(),
        userId: log.userId,
        queueId: log.queueId,
        salonId: log.salonId,
        timestamp: new Date(),
        userLocation: log.userLocation,
        salonLocation: log.salonLocation,
        distance: log.distance,
        method: log.method,
        autoApproved: log.autoApproved,
        requiresConfirmation: log.requiresConfirmation,
        verifiedBy: log.verifiedBy,
        success: log.success,
        reason: log.reason,
        suspicious: log.suspicious,
        suspiciousReasons: log.suspiciousReasons || [],
        timeSinceNotification: log.timeSinceNotification
      });

      console.log(`📝 [AUDIT] Check-in attempt logged: ${checkInLog.id} | User: ${log.userId} | Success: ${log.success} | Method: ${log.method}`);
    } catch (error) {
      console.error('Error logging check-in attempt:', error);
    }
  }

  /**
   * Log admin action
   * @param log Admin action details
   */
  async logAdminAction(log: AdminActionLog): Promise<void> {
    try {
      console.log(`📝 [AUDIT] Admin action: ${log.action} | Admin: ${log.adminId} | Queue: ${log.queueId} | Details:`, log.details);
      
      // Store admin actions for audit trail
      // This could be extended to a separate AdminActionLog collection
      
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Log notification delivery across all channels
   * @param log Notification delivery details
   */
  async logNotificationDelivery(log: NotificationDeliveryLog): Promise<void> {
    try {
      const notificationLog = await NotificationLogModel.create({
        id: randomUUID(),
        userId: log.userId,
        queueId: log.queueId,
        salonId: log.salonId,
        timestamp: new Date(),
        type: log.type,
        title: log.title,
        body: log.body,
        channels: log.channels,
        viewed: false
      });

      console.log(`📝 [AUDIT] Notification logged: ${notificationLog.id} | Type: ${log.type} | User: ${log.userId} | WhatsApp: ${log.channels.whatsapp.sent} | WebSocket: ${log.channels.websocket.sent}`);
    } catch (error) {
      console.error('Error logging notification delivery:', error);
    }
  }

  /**
   * Get check-in history for a user
   * @param userId User ID
   * @param limit Number of records to return
   * @param offset Pagination offset
   */
  async getCheckInHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const logs = await CheckInLogModel.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const total = await CheckInLogModel.countDocuments({ userId });

      return { logs, total };
    } catch (error) {
      console.error('Error getting check-in history:', error);
      throw error;
    }
  }

  /**
   * Get notification history for a user
   * @param userId User ID
   * @param limit Number of records to return
   * @param offset Pagination offset
   */
  async getNotificationHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const logs = await NotificationLogModel.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const total = await NotificationLogModel.countDocuments({ userId });

      return { logs, total };
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }
  }

  /**
   * Get all logs for a specific queue
   * @param queueId Queue ID
   */
  async getQueueAuditTrail(queueId: string) {
    try {
      const checkInLogs = await CheckInLogModel.find({ queueId }).sort({ timestamp: 1 });
      const notificationLogs = await NotificationLogModel.find({ queueId }).sort({ timestamp: 1 });

      return {
        checkInLogs,
        notificationLogs
      };
    } catch (error) {
      console.error('Error getting queue audit trail:', error);
      throw error;
    }
  }

  /**
   * Get suspicious check-in attempts for a salon
   * @param salonId Salon ID
   * @param limit Number of records to return
   */
  async getSuspiciousCheckIns(salonId: string, limit: number = 20) {
    try {
      const logs = await CheckInLogModel.find({
        salonId,
        suspicious: true
      })
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Error getting suspicious check-ins:', error);
      throw error;
    }
  }
}

export default new AuditService();
