import { UserReputationModel } from '../db';
import type { TrustLevel, UserReputation } from '../schema';
import { randomUUID } from 'crypto';

type ReputationAction = 
  | 'successful_checkin'
  | 'false_checkin'
  | 'no_show'
  | 'completed_service'
  | 'admin_override';

class ReputationService {
  /**
   * Get user reputation or initialize if doesn't exist
   * @param userId User ID
   * @returns User reputation record
   */
  async getUserReputation(userId: string): Promise<UserReputation> {
    let reputation = await UserReputationModel.findOne({ userId });

    // Initialize reputation if doesn't exist
    if (!reputation) {
      const newReputation = {
        id: randomUUID(),
        userId,
        totalCheckIns: 0,
        successfulCheckIns: 0,
        falseCheckIns: 0,
        noShows: 0,
        completedServices: 0,
        reputationScore: 50, // Start at 50
        trustLevel: 'new' as TrustLevel,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      reputation = await UserReputationModel.create(newReputation);
      console.log(`✅ Initialized reputation for user: ${userId}`);
    }

    return reputation.toObject() as UserReputation;
  }

  /**
   * Update user reputation based on action
   * @param userId User ID
   * @param action Action that affects reputation
   * @returns Updated reputation record
   */
  async updateReputation(
    userId: string,
    action: ReputationAction
  ): Promise<UserReputation> {
    // Get or create reputation
    let reputation = await UserReputationModel.findOne({ userId });
    
    if (!reputation) {
      reputation = await UserReputationModel.create({
        id: randomUUID(),
        userId,
        totalCheckIns: 0,
        successfulCheckIns: 0,
        falseCheckIns: 0,
        noShows: 0,
        completedServices: 0,
        reputationScore: 50,
        trustLevel: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Apply score adjustments based on action
    let scoreChange = 0;
    
    switch (action) {
      case 'successful_checkin':
        reputation.successfulCheckIns += 1;
        reputation.totalCheckIns += 1;
        reputation.lastCheckInAt = new Date();
        scoreChange = 2;
        break;

      case 'false_checkin':
        reputation.falseCheckIns += 1;
        reputation.totalCheckIns += 1;
        scoreChange = -10;
        break;

      case 'no_show':
        reputation.noShows += 1;
        reputation.lastNoShowAt = new Date();
        scoreChange = -5;
        break;

      case 'completed_service':
        reputation.completedServices += 1;
        scoreChange = 1;
        break;

      case 'admin_override':
        scoreChange = -3;
        break;
    }

    // Update score (keep between 0 and 100)
    reputation.reputationScore = Math.max(
      0,
      Math.min(100, reputation.reputationScore + scoreChange)
    );

    // Recalculate trust level
    reputation.trustLevel = this.calculateTrustLevel(reputation.reputationScore);
    reputation.updatedAt = new Date();

    // Save changes
    await reputation.save();

    console.log(
      `📊 Updated reputation for user ${userId}: ${action} (${scoreChange > 0 ? '+' : ''}${scoreChange}) -> Score: ${reputation.reputationScore}, Level: ${reputation.trustLevel}`
    );

    return reputation.toObject() as UserReputation;
  }

  /**
   * Calculate trust level from reputation score
   * @param score Reputation score (0-100)
   * @returns Trust level
   */
  calculateTrustLevel(score: number): TrustLevel {
    if (score >= 90) {
      return 'trusted';
    } else if (score >= 70) {
      return 'regular';
    } else if (score >= 40) {
      return 'new';
    } else if (score >= 20) {
      return 'suspicious';
    } else {
      return 'banned';
    }
  }

  /**
   * Check if user is banned from joining queues
   * @param userId User ID
   * @returns True if user is banned
   */
  async isUserBanned(userId: string): Promise<boolean> {
    const reputation = await this.getUserReputation(userId);
    return reputation.trustLevel === 'banned';
  }
}

export default new ReputationService();
