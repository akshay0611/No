import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import analyticsService from '../services/analyticsService';

const router = Router();

/**
 * GET /api/analytics/queue-metrics
 * Get comprehensive queue metrics for admin dashboard
 */
router.get(
  '/queue-metrics',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId, startDate, endDate } = req.query;

      // Parse dates if provided
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await analyticsService.getQueueMetrics(
        salonId as string | undefined,
        start,
        end
      );

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/salon-metrics/:salonId
 * Get detailed metrics for a specific salon
 */
router.get(
  '/salon-metrics/:salonId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId } = req.params;
      const { startDate, endDate } = req.query;

      // Parse dates if provided
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await analyticsService.getSalonMetrics(salonId, start, end);

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/check-in-success-rate
 * Get check-in success rate
 */
router.get(
  '/check-in-success-rate',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId, startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const rate = await analyticsService.getCheckInSuccessRate(
        salonId as string | undefined,
        start,
        end
      );

      res.json({ checkInSuccessRate: rate });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/auto-approval-rate
 * Get auto-approval rate
 */
router.get(
  '/auto-approval-rate',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId, startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const rate = await analyticsService.getAutoApprovalRate(
        salonId as string | undefined,
        start,
        end
      );

      res.json({ autoApprovalRate: rate });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/no-show-rate
 * Get no-show rate
 */
router.get(
  '/no-show-rate',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId, startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const rate = await analyticsService.getNoShowRate(
        salonId as string | undefined,
        start,
        end
      );

      res.json({ noShowRate: rate });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/notification-delivery-rate
 * Get notification delivery rate
 */
router.get(
  '/notification-delivery-rate',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { salonId, startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const rate = await analyticsService.getNotificationDeliveryRate(
        salonId as string | undefined,
        start,
        end
      );

      res.json({ notificationDeliveryRate: rate });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
