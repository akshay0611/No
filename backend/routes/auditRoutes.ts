import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import auditService from '../services/auditService';

const router = Router();

/**
 * GET /api/users/:userId/checkin-history
 * Get check-in history for a user (admin only)
 */
router.get(
  '/users/:userId/checkin-history',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await auditService.getCheckInHistory(userId, limit, offset);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/:userId/notification-history
 * Get notification history for a user (admin only)
 */
router.get(
  '/users/:userId/notification-history',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await auditService.getNotificationHistory(userId, limit, offset);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/queues/:queueId/audit-trail
 * Get complete audit trail for a specific queue (admin only)
 */
router.get(
  '/queues/:queueId/audit-trail',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { queueId } = req.params;

      const result = await auditService.getQueueAuditTrail(queueId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/salons/:salonId/suspicious-checkins
 * Get suspicious check-in attempts for a salon (admin only)
 */
router.get(
  '/salons/:salonId/suspicious-checkins',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const logs = await auditService.getSuspiciousCheckIns(salonId, limit);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
