import queueService from '../services/queueService';
import { QueueModel } from '../db';

/**
 * Background job to detect and mark no-shows
 * Runs every 5 minutes
 */
export function startNoShowDetectionJob() {
  console.log('🔄 Starting no-show detection background job (runs every 5 minutes)');
  
  // Run immediately on startup
  processNoShowsJob();
  
  // Then run every 5 minutes
  setInterval(processNoShowsJob, 5 * 60 * 1000);
}

/**
 * Process no-shows job
 */
async function processNoShowsJob() {
  try {
    console.log('⏰ Running no-show detection job...');
    await queueService.processNoShows();
    console.log('✅ No-show detection job completed');
  } catch (error) {
    console.error('❌ Error in no-show detection job:', error);
  }
}

/**
 * Background job to auto-reject pending verifications after timeout
 * Checks every minute for pending verifications older than 5 minutes
 */
export function startPendingVerificationTimeoutJob() {
  console.log('🔄 Starting pending verification timeout job (runs every minute)');
  
  // Run immediately on startup
  processPendingVerificationTimeouts();
  
  // Then run every minute
  setInterval(processPendingVerificationTimeouts, 60 * 1000);
}

/**
 * Process pending verification timeouts
 */
async function processPendingVerificationTimeouts() {
  try {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Find queues in pending_verification status for more than 5 minutes
    const expiredVerifications = await QueueModel.find({
      status: 'pending_verification',
      checkInAttemptedAt: { $lte: fiveMinutesAgo }
    });

    if (expiredVerifications.length === 0) {
      return;
    }

    console.log(`⏰ Found ${expiredVerifications.length} expired pending verifications`);

    for (const queue of expiredVerifications) {
      // Revert status to 'notified'
      const oldStatus = queue.status;
      queue.status = 'notified';
      await queue.save();

      console.log(`⏱️ Auto-rejected pending verification for queue ${queue.id} (timeout)`);

      // Note: We could send a notification to the user here
      // For now, just log it
    }

    console.log(`✅ Processed ${expiredVerifications.length} pending verification timeouts`);
  } catch (error) {
    console.error('❌ Error in pending verification timeout job:', error);
  }
}

/**
 * Initialize all background jobs
 */
export function initializeBackgroundJobs() {
  console.log('🚀 Initializing background jobs...');
  
  startNoShowDetectionJob();
  startPendingVerificationTimeoutJob();
  
  console.log('✅ Background jobs initialized');
}
