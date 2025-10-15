import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import healthCheckService from '../services/healthCheckService';

const router = Router();

/**
 * GET /api/health/queue-system
 * Get comprehensive health status of the queue system
 * Admin only endpoint
 */
router.get(
  '/queue-system',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const health = await healthCheckService.getHealthStatus();

      // Set appropriate HTTP status code based on health
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health
 * Simple health check endpoint for load balancers
 * Public endpoint - no authentication required
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await healthCheckService.getSimpleHealth();

      const statusCode = health.status === 'ok' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({ status: 'error' });
    }
  }
);

/**
 * GET /api/health/database
 * Check database connectivity
 */
router.get(
  '/database',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const dbHealth = await healthCheckService.checkDatabase();

      const statusCode = dbHealth.status === 'up' ? 200 : 503;

      res.status(statusCode).json(dbHealth);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/websocket
 * Check WebSocket server status
 */
router.get(
  '/websocket',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const wsHealth = await healthCheckService.checkWebSocket();

      const statusCode = wsHealth.status === 'up' ? 200 : 503;

      res.status(statusCode).json(wsHealth);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health/whatsapp
 * Check Twilio/WhatsApp API connectivity
 */
router.get(
  '/whatsapp',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify admin authorization
      if (req.user?.role !== 'salon_owner') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const whatsappHealth = await healthCheckService.checkWhatsApp();

      const statusCode = whatsappHealth.status === 'up' ? 200 : 
                        whatsappHealth.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(whatsappHealth);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
