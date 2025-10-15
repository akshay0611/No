import type { Request, Response, NextFunction } from 'express';
import { createQueueError } from '../errors/QueueError';

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  errorCode?: 'RATE_LIMIT_EXCEEDED' | 'NOTIFICATION_RATE_LIMIT';
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  check(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // No entry or expired - create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= maxAttempts) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current count for a key
   */
  getCount(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Destroy the store and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxAttempts,
    windowMs,
    keyGenerator = (req: Request) => req.user?.userId || req.ip || 'anonymous',
    errorCode = 'RATE_LIMIT_EXCEEDED'
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const { allowed, retryAfter } = rateLimitStore.check(key, maxAttempts, windowMs);

      if (!allowed) {
        // Set Retry-After header
        if (retryAfter) {
          res.setHeader('Retry-After', retryAfter.toString());
        }

        throw createQueueError(errorCode, {
          maxAttempts,
          windowSeconds: Math.ceil(windowMs / 1000),
          retryAfter
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Rate limiter for check-in endpoint
 * 3 attempts per 5 minutes per user
 */
export const checkInRateLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req: Request) => {
    // Rate limit by user ID and queue ID combination
    const userId = req.user?.userId || 'anonymous';
    const queueId = req.params.id || 'unknown';
    return `checkin:${userId}:${queueId}`;
  },
  errorCode: 'RATE_LIMIT_EXCEEDED'
});

/**
 * Rate limiter for notification endpoint
 * 10 attempts per hour per salon
 */
export const notificationRateLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (req: Request) => {
    // Rate limit by salon ID
    // We'll need to get salon ID from the queue
    const queueId = req.params.id || 'unknown';
    return `notification:queue:${queueId}`;
  },
  errorCode: 'NOTIFICATION_RATE_LIMIT'
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per user
 */
export const generalRateLimiter = createRateLimiter({
  maxAttempts: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req: Request) => {
    const userId = req.user?.userId || req.ip || 'anonymous';
    return `api:${userId}`;
  }
});

/**
 * Reset rate limit for a specific key
 * Useful for testing or admin overrides
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.reset(key);
}

/**
 * Get current rate limit count for a key
 */
export function getRateLimitCount(key: string): number {
  return rateLimitStore.getCount(key);
}

/**
 * Export store for testing
 */
export { rateLimitStore };
