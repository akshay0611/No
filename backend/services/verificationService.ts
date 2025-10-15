import { CheckInLogModel, QueueModel, UserReputationModel } from '../db';
import type { TrustLevel } from '../schema';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface VerificationResult {
  verified: boolean;
  distance: number;
  autoApproved: boolean;
  requiresReview: boolean;
  reason: string;
}

interface SuspiciousPattern {
  type: 'repeated_location' | 'fast_checkin' | 'multiple_salons';
  description: string;
}

class VerificationService {
  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @param loc1 First location
   * @param loc2 Second location
   * @returns Distance in meters
   */
  calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return Math.round(distance);
  }

  /**
   * Get approval distance threshold based on user's trust level
   * @param trustLevel User's trust level
   * @returns Distance threshold in meters
   */
  getApprovalDistance(trustLevel: TrustLevel): number {
    const distanceThresholds: Record<TrustLevel, number> = {
      new: 50,        // 50 meters for new users
      regular: 100,   // 100 meters for regular users
      trusted: 200,   // 200 meters for trusted users
      suspicious: 0,  // Requires admin confirmation regardless of distance
      banned: 0       // Banned users cannot check in
    };

    return distanceThresholds[trustLevel];
  }

  /**
   * Verify user location against salon location with trust-based rules
   * @param userLocation User's current location
   * @param salonLocation Salon's location
   * @param userId User ID for trust level lookup
   * @returns Verification result
   */
  async verifyLocation(
    userLocation: LocationData,
    salonLocation: LocationData,
    userId: string
  ): Promise<VerificationResult> {
    // Calculate distance
    const distance = this.calculateDistance(userLocation, salonLocation);

    // Get user's reputation and trust level
    const reputation = await UserReputationModel.findOne({ userId });
    const trustLevel: TrustLevel = reputation?.trustLevel || 'new';

    // Check if user is banned
    if (trustLevel === 'banned') {
      return {
        verified: false,
        distance,
        autoApproved: false,
        requiresReview: false,
        reason: 'User account is banned'
      };
    }

    // Get approval distance for trust level
    const approvalDistance = this.getApprovalDistance(trustLevel);

    // Check for suspicious patterns
    const suspiciousPatterns = await this.detectSuspiciousPatterns(userId, '');

    // If suspicious patterns detected, require admin review
    if (suspiciousPatterns.length > 0 || trustLevel === 'suspicious') {
      return {
        verified: true,
        distance,
        autoApproved: false,
        requiresReview: true,
        reason: suspiciousPatterns.length > 0 
          ? `Suspicious pattern detected: ${suspiciousPatterns[0].description}`
          : 'User flagged as suspicious, requires admin verification'
      };
    }

    // Auto-approve if within threshold
    if (distance <= approvalDistance) {
      return {
        verified: true,
        distance,
        autoApproved: true,
        requiresReview: false,
        reason: 'Location verified automatically'
      };
    }

    // Distance between approval threshold and 1km - requires admin review
    if (distance <= 1000) {
      return {
        verified: true,
        distance,
        autoApproved: false,
        requiresReview: true,
        reason: `User is ${distance}m away, outside auto-approval range (${approvalDistance}m)`
      };
    }

    // Too far away - reject
    return {
      verified: false,
      distance,
      autoApproved: false,
      requiresReview: false,
      reason: `User is too far away (${distance}m)`
    };
  }

  /**
   * Detect suspicious patterns in user check-in behavior
   * @param userId User ID
   * @param queueId Current queue ID
   * @returns Array of suspicious patterns detected
   */
  async detectSuspiciousPatterns(
    userId: string,
    queueId: string
  ): Promise<SuspiciousPattern[]> {
    const patterns: SuspiciousPattern[] = [];

    try {
      // Get recent check-in logs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentCheckIns = await CheckInLogModel.find({
        userId,
        timestamp: { $gte: thirtyDaysAgo }
      }).sort({ timestamp: -1 }).limit(10);

      // Pattern 1: Repeated location (same location more than 3 times)
      if (recentCheckIns.length >= 3) {
        const locationCounts = new Map<string, number>();
        
        recentCheckIns.forEach(log => {
          if (log.userLocation && log.userLocation.latitude && log.userLocation.longitude) {
            const key = `${log.userLocation.latitude.toFixed(4)},${log.userLocation.longitude.toFixed(4)}`;
            locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
          }
        });

        for (const [location, count] of locationCounts.entries()) {
          if (count > 3) {
            patterns.push({
              type: 'repeated_location',
              description: `Same location used ${count} times`
            });
            break;
          }
        }
      }

      // Pattern 2: Fast check-in (less than 2 minutes after notification)
      if (queueId) {
        const queue = await QueueModel.findOne({ id: queueId });
        if (queue?.notifiedAt) {
          const timeSinceNotification = Date.now() - queue.notifiedAt.getTime();
          if (timeSinceNotification < 2 * 60 * 1000) { // 2 minutes
            patterns.push({
              type: 'fast_checkin',
              description: 'Check-in attempted less than 2 minutes after notification'
            });
          }
        }
      }

      // Pattern 3: Multiple active salon queues
      const activeQueues = await QueueModel.find({
        userId,
        status: { $in: ['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress'] }
      });

      if (activeQueues.length > 1) {
        const uniqueSalons = new Set(activeQueues.map(q => q.salonId));
        if (uniqueSalons.size > 1) {
          patterns.push({
            type: 'multiple_salons',
            description: `Active queues at ${uniqueSalons.size} different salons`
          });
        }
      }

    } catch (error) {
      console.error('Error detecting suspicious patterns:', error);
    }

    return patterns;
  }
}

export default new VerificationService();
