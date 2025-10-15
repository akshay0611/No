/**
 * Resilience utilities for external service calls
 * Provides retry logic, circuit breaker, and graceful degradation
 */

interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker for external services
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if we should try again
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // Require multiple successes to close circuit
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED;
        console.log('Circuit breaker CLOSED - service recovered');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during testing, reopen circuit
      this.state = CircuitState.OPEN;
      console.log('Circuit breaker reopened - service still failing');
    } else if (this.failureCount >= this.options.failureThreshold) {
      // Too many failures, open circuit
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker OPEN - ${this.failureCount} failures detected`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    delayMs,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: any;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Log retry attempt
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms delay`);

      // Wait before retrying
      await sleep(currentDelay);

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breakers for external services
 */
export const circuitBreakers = {
  whatsapp: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
    monitoringWindowMs: 300000 // 5 minutes
  }),
  
  websocket: new CircuitBreaker({
    failureThreshold: 10,
    resetTimeoutMs: 30000, // 30 seconds
    monitoringWindowMs: 60000 // 1 minute
  }),
  
  push: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
    monitoringWindowMs: 300000 // 5 minutes
  })
};

/**
 * Execute WhatsApp call with retry and circuit breaker
 */
export async function executeWhatsAppWithResilience<T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const result = await circuitBreakers.whatsapp.execute(async () => {
      return await retryWithBackoff(fn, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        shouldRetry: (error) => {
          // Retry on network errors, not on validation errors
          return error?.code === 'ECONNREFUSED' || 
                 error?.code === 'ETIMEDOUT' ||
                 error?.statusCode >= 500;
        }
      });
    });

    return { success: true, result };
  } catch (error: any) {
    console.error('WhatsApp call failed after retries:', error);
    return {
      success: false,
      error: error?.message || 'WhatsApp service unavailable'
    };
  }
}

/**
 * Execute WebSocket call with circuit breaker
 */
export async function executeWebSocketWithResilience<T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const result = await circuitBreakers.websocket.execute(fn);
    return { success: true, result };
  } catch (error: any) {
    console.error('WebSocket call failed:', error);
    return {
      success: false,
      error: error?.message || 'WebSocket service unavailable'
    };
  }
}

/**
 * Execute push notification with retry and circuit breaker
 */
export async function executePushWithResilience<T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const result = await circuitBreakers.push.execute(async () => {
      return await retryWithBackoff(fn, {
        maxAttempts: 2,
        delayMs: 500,
        shouldRetry: (error) => {
          // Don't retry on 410 (expired subscription) or 404
          return error?.statusCode !== 410 && error?.statusCode !== 404;
        }
      });
    });

    return { success: true, result };
  } catch (error: any) {
    console.error('Push notification failed after retries:', error);
    return {
      success: false,
      error: error?.message || 'Push notification service unavailable'
    };
  }
}

/**
 * Message queue for failed notifications
 * Stores messages to retry when service recovers
 */
class MessageQueue {
  private queue: Array<{
    id: string;
    userId: string;
    message: any;
    timestamp: number;
    attempts: number;
  }> = [];
  
  private maxQueueSize = 1000;
  private maxAge = 3600000; // 1 hour

  /**
   * Add message to queue
   */
  enqueue(userId: string, message: any): void {
    // Remove old messages
    this.cleanup();

    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('Message queue full, dropping oldest message');
      this.queue.shift();
    }

    this.queue.push({
      id: `${userId}-${Date.now()}`,
      userId,
      message,
      timestamp: Date.now(),
      attempts: 0
    });

    console.log(`Message queued for user ${userId}. Queue size: ${this.queue.length}`);
  }

  /**
   * Get messages for a user
   */
  getMessagesForUser(userId: string): any[] {
    return this.queue
      .filter(item => item.userId === userId)
      .map(item => item.message);
  }

  /**
   * Remove messages for a user after successful delivery
   */
  removeMessagesForUser(userId: string): void {
    const beforeSize = this.queue.length;
    this.queue = this.queue.filter(item => item.userId !== userId);
    const removed = beforeSize - this.queue.length;
    
    if (removed > 0) {
      console.log(`Removed ${removed} queued messages for user ${userId}`);
    }
  }

  /**
   * Clean up old messages
   */
  private cleanup(): void {
    const now = Date.now();
    const beforeSize = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      return now - item.timestamp < this.maxAge;
    });

    const removed = beforeSize - this.queue.length;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} expired messages from queue`);
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.queue = [];
  }
}

// Global message queue for WebSocket messages
export const websocketMessageQueue = new MessageQueue();

/**
 * Health check for external services
 */
export interface ServiceHealth {
  whatsapp: {
    available: boolean;
    circuitState: CircuitState;
  };
  websocket: {
    available: boolean;
    circuitState: CircuitState;
    queuedMessages: number;
  };
  push: {
    available: boolean;
    circuitState: CircuitState;
  };
}

/**
 * Get health status of all external services
 */
export function getServiceHealth(): ServiceHealth {
  return {
    whatsapp: {
      available: circuitBreakers.whatsapp.getState() !== CircuitState.OPEN,
      circuitState: circuitBreakers.whatsapp.getState()
    },
    websocket: {
      available: circuitBreakers.websocket.getState() !== CircuitState.OPEN,
      circuitState: circuitBreakers.websocket.getState(),
      queuedMessages: websocketMessageQueue.size()
    },
    push: {
      available: circuitBreakers.push.getState() !== CircuitState.OPEN,
      circuitState: circuitBreakers.push.getState()
    }
  };
}

/**
 * Reset all circuit breakers (for testing or manual recovery)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.whatsapp.reset();
  circuitBreakers.websocket.reset();
  circuitBreakers.push.reset();
  console.log('All circuit breakers reset');
}
