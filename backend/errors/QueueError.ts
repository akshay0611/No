/**
 * Custom error class for queue management operations
 * Provides structured error handling with user-friendly messages
 */
export class QueueError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    userMessage: string,
    retryable: boolean = false,
    details?: any
  ) {
    super(message);
    this.name = 'QueueError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error codes for queue management system
 */
export const QueueErrorCodes = {
  // Location errors (4xx)
  LOCATION_PERMISSION_DENIED: {
    code: 'LOCATION_PERMISSION_DENIED',
    statusCode: 400,
    userMessage: 'Please enable location access to check in',
    retryable: true
  },
  LOCATION_UNAVAILABLE: {
    code: 'LOCATION_UNAVAILABLE',
    statusCode: 400,
    userMessage: 'Unable to get your location. Please try again or check in manually.',
    retryable: true
  },
  LOCATION_TIMEOUT: {
    code: 'LOCATION_TIMEOUT',
    statusCode: 408,
    userMessage: 'Location request timed out. Please try again.',
    retryable: true
  },
  LOCATION_ACCURACY_LOW: {
    code: 'LOCATION_ACCURACY_LOW',
    statusCode: 400,
    userMessage: 'Location accuracy is too low. Please ensure GPS is enabled.',
    retryable: true
  },
  LOCATION_TOO_FAR: {
    code: 'LOCATION_TOO_FAR',
    statusCode: 400,
    userMessage: 'You are too far from the salon. Please arrive before checking in.',
    retryable: true
  },
  INVALID_COORDINATES: {
    code: 'INVALID_COORDINATES',
    statusCode: 400,
    userMessage: 'Invalid location coordinates provided.',
    retryable: false
  },

  // Verification errors (4xx)
  SUSPICIOUS_PATTERN: {
    code: 'SUSPICIOUS_PATTERN',
    statusCode: 403,
    userMessage: 'Check-in requires admin verification. Please show this screen to staff.',
    retryable: false
  },
  VERIFICATION_PENDING: {
    code: 'VERIFICATION_PENDING',
    statusCode: 409,
    userMessage: 'Your check-in is pending admin verification. Please wait.',
    retryable: false
  },
  VERIFICATION_FAILED: {
    code: 'VERIFICATION_FAILED',
    statusCode: 400,
    userMessage: 'Check-in verification failed. Please try again or contact staff.',
    retryable: true
  },
  VERIFICATION_TIMEOUT: {
    code: 'VERIFICATION_TIMEOUT',
    statusCode: 408,
    userMessage: 'Verification timed out. Please check in again.',
    retryable: true
  },

  // Rate limiting errors (4xx)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    userMessage: 'Too many check-in attempts. Please wait 5 minutes.',
    retryable: true
  },
  NOTIFICATION_RATE_LIMIT: {
    code: 'NOTIFICATION_RATE_LIMIT',
    statusCode: 429,
    userMessage: 'Too many notifications sent. Please wait before sending more.',
    retryable: true
  },

  // User status errors (4xx)
  USER_BANNED: {
    code: 'USER_BANNED',
    statusCode: 403,
    userMessage: 'Your account has been restricted. Please contact support.',
    retryable: false
  },
  USER_SUSPICIOUS: {
    code: 'USER_SUSPICIOUS',
    statusCode: 403,
    userMessage: 'Your account requires additional verification. Please contact staff.',
    retryable: false
  },
  PROFILE_INCOMPLETE: {
    code: 'PROFILE_INCOMPLETE',
    statusCode: 400,
    userMessage: 'Please complete your profile before joining a queue.',
    retryable: false
  },

  // Queue state errors (4xx)
  QUEUE_NOT_FOUND: {
    code: 'QUEUE_NOT_FOUND',
    statusCode: 404,
    userMessage: 'Queue entry not found.',
    retryable: false
  },
  INVALID_STATUS_TRANSITION: {
    code: 'INVALID_STATUS_TRANSITION',
    statusCode: 400,
    userMessage: 'This action is not available at this time.',
    retryable: false
  },
  QUEUE_ALREADY_COMPLETED: {
    code: 'QUEUE_ALREADY_COMPLETED',
    statusCode: 400,
    userMessage: 'This queue entry has already been completed.',
    retryable: false
  },
  QUEUE_CANCELLED: {
    code: 'QUEUE_CANCELLED',
    statusCode: 400,
    userMessage: 'This queue entry has been cancelled.',
    retryable: false
  },
  ALREADY_IN_QUEUE: {
    code: 'ALREADY_IN_QUEUE',
    statusCode: 409,
    userMessage: 'You are already in this salon\'s queue.',
    retryable: false
  },
  MULTIPLE_ACTIVE_QUEUES: {
    code: 'MULTIPLE_ACTIVE_QUEUES',
    statusCode: 409,
    userMessage: 'You have active queues at multiple salons. This requires verification.',
    retryable: false
  },

  // Authorization errors (4xx)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    statusCode: 401,
    userMessage: 'You must be logged in to perform this action.',
    retryable: false
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    statusCode: 403,
    userMessage: 'You do not have permission to perform this action.',
    retryable: false
  },
  NOT_QUEUE_OWNER: {
    code: 'NOT_QUEUE_OWNER',
    statusCode: 403,
    userMessage: 'You can only check in to your own queue.',
    retryable: false
  },
  NOT_SALON_OWNER: {
    code: 'NOT_SALON_OWNER',
    statusCode: 403,
    userMessage: 'You do not have permission to manage this salon\'s queue.',
    retryable: false
  },

  // Salon errors (4xx)
  SALON_NOT_FOUND: {
    code: 'SALON_NOT_FOUND',
    statusCode: 404,
    userMessage: 'Salon not found.',
    retryable: false
  },
  SALON_CLOSED: {
    code: 'SALON_CLOSED',
    statusCode: 400,
    userMessage: 'This salon is currently closed.',
    retryable: false
  },
  SALON_LOCATION_MISSING: {
    code: 'SALON_LOCATION_MISSING',
    statusCode: 500,
    userMessage: 'Salon location is not configured. Please contact the salon.',
    retryable: false
  },

  // Notification errors (5xx)
  NOTIFICATION_FAILED: {
    code: 'NOTIFICATION_FAILED',
    statusCode: 500,
    userMessage: 'Failed to send notification. Please try again.',
    retryable: true
  },
  WHATSAPP_FAILED: {
    code: 'WHATSAPP_FAILED',
    statusCode: 500,
    userMessage: 'Failed to send WhatsApp message. You will receive in-app notifications.',
    retryable: true
  },
  WEBSOCKET_FAILED: {
    code: 'WEBSOCKET_FAILED',
    statusCode: 500,
    userMessage: 'Failed to send real-time notification. Please refresh the page.',
    retryable: true
  },
  PUSH_NOTIFICATION_FAILED: {
    code: 'PUSH_NOTIFICATION_FAILED',
    statusCode: 500,
    userMessage: 'Failed to send push notification.',
    retryable: true
  },

  // Validation errors (4xx)
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    statusCode: 400,
    userMessage: 'Invalid input provided.',
    retryable: false
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    statusCode: 400,
    userMessage: 'Required field is missing.',
    retryable: false
  },
  INVALID_QUEUE_ID: {
    code: 'INVALID_QUEUE_ID',
    statusCode: 400,
    userMessage: 'Invalid queue ID format.',
    retryable: false
  },
  INVALID_USER_ID: {
    code: 'INVALID_USER_ID',
    statusCode: 400,
    userMessage: 'Invalid user ID format.',
    retryable: false
  },
  INVALID_SALON_ID: {
    code: 'INVALID_SALON_ID',
    statusCode: 400,
    userMessage: 'Invalid salon ID format.',
    retryable: false
  },

  // Server errors (5xx)
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    statusCode: 500,
    userMessage: 'A database error occurred. Please try again.',
    retryable: true
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    statusCode: 503,
    userMessage: 'Service is temporarily unavailable. Please try again later.',
    retryable: true
  }
} as const;

/**
 * Helper function to create a QueueError from a predefined error code
 */
export function createQueueError(
  errorCode: keyof typeof QueueErrorCodes,
  details?: any
): QueueError {
  const errorDef = QueueErrorCodes[errorCode];
  return new QueueError(
    errorDef.code,
    errorDef.code, // Internal message
    errorDef.statusCode,
    errorDef.userMessage,
    errorDef.retryable,
    details
  );
}
