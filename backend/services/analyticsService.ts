import { CheckInLogModel, NotificationLogModel, QueueModel } from '../db';

interface QueueMetrics {
  checkInSuccessRate: number;
  autoApprovalRate: number;
  averageVerificationTime: number; // in seconds
  noShowRate: number;
  notificationDeliveryRate: number;
  totalCheckIns: number;
  totalQueues: number;
  totalNotifications: number;
  channelBreakdown: {
    whatsapp: number;
    websocket: number;
    push: number;
  };
}

interface SalonMetrics extends QueueMetrics {
  salonId: string;
  activeQueues: number;
  completedQueues: number;
  averageWaitTime: number; // in minutes
}

class AnalyticsService {
  /**
   * Calculate check-in success rate
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getCheckInSuccessRate(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const query: any = {};
      
      if (salonId) {
        query.salonId = salonId;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const totalCheckIns = await CheckInLogModel.countDocuments(query);
      const successfulCheckIns = await CheckInLogModel.countDocuments({
        ...query,
        success: true
      });

      return totalCheckIns > 0 ? (successfulCheckIns / totalCheckIns) * 100 : 0;
    } catch (error) {
      console.error('Error calculating check-in success rate:', error);
      return 0;
    }
  }

  /**
   * Calculate auto-approval rate
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getAutoApprovalRate(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const query: any = { success: true };
      
      if (salonId) {
        query.salonId = salonId;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const totalSuccessfulCheckIns = await CheckInLogModel.countDocuments(query);
      const autoApprovedCheckIns = await CheckInLogModel.countDocuments({
        ...query,
        autoApproved: true
      });

      return totalSuccessfulCheckIns > 0 
        ? (autoApprovedCheckIns / totalSuccessfulCheckIns) * 100 
        : 0;
    } catch (error) {
      console.error('Error calculating auto-approval rate:', error);
      return 0;
    }
  }

  /**
   * Calculate average verification time
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getAverageVerificationTime(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const query: any = {
        success: true,
        timeSinceNotification: { $exists: true, $ne: null }
      };
      
      if (salonId) {
        query.salonId = salonId;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const checkIns = await CheckInLogModel.find(query).select('timeSinceNotification');

      if (checkIns.length === 0) return 0;

      const totalTime = checkIns.reduce((sum, log) => {
        return sum + (log.timeSinceNotification || 0);
      }, 0);

      // Return average in seconds
      return totalTime / checkIns.length / 1000;
    } catch (error) {
      console.error('Error calculating average verification time:', error);
      return 0;
    }
  }

  /**
   * Calculate no-show rate
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getNoShowRate(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const query: any = {};
      
      if (salonId) {
        query.salonId = salonId;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const totalQueues = await QueueModel.countDocuments({
        ...query,
        status: { $in: ['completed', 'no-show'] }
      });

      const noShows = await QueueModel.countDocuments({
        ...query,
        status: 'no-show'
      });

      return totalQueues > 0 ? (noShows / totalQueues) * 100 : 0;
    } catch (error) {
      console.error('Error calculating no-show rate:', error);
      return 0;
    }
  }

  /**
   * Calculate notification delivery rate
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getNotificationDeliveryRate(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const query: any = {};
      
      if (salonId) {
        query.salonId = salonId;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const totalNotifications = await NotificationLogModel.countDocuments(query);
      
      // Count notifications where at least one channel succeeded
      const deliveredNotifications = await NotificationLogModel.countDocuments({
        ...query,
        $or: [
          { 'channels.whatsapp.sent': true },
          { 'channels.websocket.sent': true },
          { 'channels.push.sent': true }
        ]
      });

      return totalNotifications > 0 
        ? (deliveredNotifications / totalNotifications) * 100 
        : 0;
    } catch (error) {
      console.error('Error calculating notification delivery rate:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive queue metrics
   * @param salonId Optional salon ID to filter by
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getQueueMetrics(
    salonId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QueueMetrics> {
    try {
      const [
        checkInSuccessRate,
        autoApprovalRate,
        averageVerificationTime,
        noShowRate,
        notificationDeliveryRate
      ] = await Promise.all([
        this.getCheckInSuccessRate(salonId, startDate, endDate),
        this.getAutoApprovalRate(salonId, startDate, endDate),
        this.getAverageVerificationTime(salonId, startDate, endDate),
        this.getNoShowRate(salonId, startDate, endDate),
        this.getNotificationDeliveryRate(salonId, startDate, endDate)
      ]);

      // Get counts
      const query: any = {};
      if (salonId) query.salonId = salonId;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const totalCheckIns = await CheckInLogModel.countDocuments(query);
      const totalQueues = await QueueModel.countDocuments(query);
      const totalNotifications = await NotificationLogModel.countDocuments(query);

      // Get channel breakdown
      const whatsappSent = await NotificationLogModel.countDocuments({
        ...query,
        'channels.whatsapp.sent': true
      });
      const websocketSent = await NotificationLogModel.countDocuments({
        ...query,
        'channels.websocket.sent': true
      });
      const pushSent = await NotificationLogModel.countDocuments({
        ...query,
        'channels.push.sent': true
      });

      return {
        checkInSuccessRate: Math.round(checkInSuccessRate * 100) / 100,
        autoApprovalRate: Math.round(autoApprovalRate * 100) / 100,
        averageVerificationTime: Math.round(averageVerificationTime * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
        notificationDeliveryRate: Math.round(notificationDeliveryRate * 100) / 100,
        totalCheckIns,
        totalQueues,
        totalNotifications,
        channelBreakdown: {
          whatsapp: whatsappSent,
          websocket: websocketSent,
          push: pushSent
        }
      };
    } catch (error) {
      console.error('Error getting queue metrics:', error);
      throw error;
    }
  }

  /**
   * Get salon-specific metrics
   * @param salonId Salon ID
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getSalonMetrics(
    salonId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SalonMetrics> {
    try {
      const baseMetrics = await this.getQueueMetrics(salonId, startDate, endDate);

      // Get salon-specific data
      const activeQueues = await QueueModel.countDocuments({
        salonId,
        status: { $in: ['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress'] }
      });

      const query: any = { salonId };
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const completedQueues = await QueueModel.countDocuments({
        ...query,
        status: 'completed'
      });

      // Calculate average wait time
      const completedQueuesWithTime = await QueueModel.find({
        ...query,
        status: 'completed',
        timestamp: { $exists: true },
        serviceCompletedAt: { $exists: true }
      }).select('timestamp serviceCompletedAt');

      let averageWaitTime = 0;
      if (completedQueuesWithTime.length > 0) {
        const totalWaitTime = completedQueuesWithTime.reduce((sum, queue) => {
          const waitTime = queue.serviceCompletedAt!.getTime() - queue.timestamp.getTime();
          return sum + waitTime;
        }, 0);
        averageWaitTime = totalWaitTime / completedQueuesWithTime.length / 1000 / 60; // Convert to minutes
      }

      return {
        ...baseMetrics,
        salonId,
        activeQueues,
        completedQueues,
        averageWaitTime: Math.round(averageWaitTime * 100) / 100
      };
    } catch (error) {
      console.error('Error getting salon metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics for multiple salons
   * @param salonIds Array of salon IDs
   * @param startDate Optional start date for time range
   * @param endDate Optional end date for time range
   */
  async getMultipleSalonMetrics(
    salonIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<SalonMetrics[]> {
    try {
      const metricsPromises = salonIds.map(salonId =>
        this.getSalonMetrics(salonId, startDate, endDate)
      );

      return await Promise.all(metricsPromises);
    } catch (error) {
      console.error('Error getting multiple salon metrics:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
