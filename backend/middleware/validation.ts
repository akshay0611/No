import type { Request, Response, NextFunction } from 'express';
import { createQueueError } from '../errors/QueueError';
import { Types } from 'mongoose';

/**
 * Validation utilities for queue management endpoints
 */

/**
 * Validate location coordinates
 */
export function validateLocation(latitude: number, longitude: number, accuracy?: number): void {
  // Validate latitude (-90 to 90)
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw createQueueError('INVALID_COORDINATES', {
      field: 'latitude',
      value: latitude,
      expected: 'number between -90 and 90'
    });
  }

  // Validate longitude (-180 to 180)
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw createQueueError('INVALID_COORDINATES', {
      field: 'longitude',
      value: longitude,
      expected: 'number between -180 and 180'
    });
  }

  // Validate accuracy if provided (0 to 1000 meters)
  if (accuracy !== undefined) {
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 1000) {
      throw createQueueError('LOCATION_ACCURACY_LOW', {
        field: 'accuracy',
        value: accuracy,
        expected: 'number between 0 and 1000'
      });
    }
  }
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: string, fieldName: string = 'id'): void {
  if (!id || typeof id !== 'string') {
    throw createQueueError('INVALID_INPUT', {
      field: fieldName,
      message: `${fieldName} is required and must be a string`
    });
  }

  if (!Types.ObjectId.isValid(id)) {
    throw createQueueError('INVALID_INPUT', {
      field: fieldName,
      value: id,
      message: `Invalid ${fieldName} format`
    });
  }
}

/**
 * Validate queue ID
 */
export function validateQueueId(queueId: string): void {
  validateObjectId(queueId, 'queueId');
}

/**
 * Validate user ID
 */
export function validateUserId(userId: string): void {
  validateObjectId(userId, 'userId');
}

/**
 * Validate salon ID
 */
export function validateSalonId(salonId: string): void {
  validateObjectId(salonId, 'salonId');
}

/**
 * Queue status enum
 */
export const QueueStatus = {
  WAITING: 'waiting',
  NOTIFIED: 'notified',
  PENDING_VERIFICATION: 'pending_verification',
  NEARBY: 'nearby',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  NO_SHOW: 'no-show'
} as const;

export type QueueStatusType = typeof QueueStatus[keyof typeof QueueStatus];

/**
 * Valid state transitions for queue status
 */
export const VALID_TRANSITIONS: Record<QueueStatusType, QueueStatusType[]> = {
  [QueueStatus.WAITING]: [QueueStatus.NOTIFIED, QueueStatus.NO_SHOW],
  [QueueStatus.NOTIFIED]: [QueueStatus.PENDING_VERIFICATION, QueueStatus.NO_SHOW],
  [QueueStatus.PENDING_VERIFICATION]: [QueueStatus.NEARBY, QueueStatus.NOTIFIED, QueueStatus.NO_SHOW],
  [QueueStatus.NEARBY]: [QueueStatus.IN_PROGRESS, QueueStatus.NO_SHOW],
  [QueueStatus.IN_PROGRESS]: [QueueStatus.COMPLETED, QueueStatus.NO_SHOW],
  [QueueStatus.COMPLETED]: [], // Terminal state
  [QueueStatus.NO_SHOW]: [] // Terminal state
};

/**
 * Validate queue status transition
 */
export function validateStatusTransition(
  currentStatus: QueueStatusType,
  newStatus: QueueStatusType
): void {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  
  if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
    throw createQueueError('INVALID_STATUS_TRANSITION', {
      currentStatus,
      requestedStatus: newStatus,
      validStatuses: validNextStatuses
    });
  }
}

/**
 * Validate queue status value
 */
export function validateQueueStatus(status: string): QueueStatusType {
  const validStatuses = Object.values(QueueStatus);
  
  if (!validStatuses.includes(status as QueueStatusType)) {
    throw createQueueError('INVALID_INPUT', {
      field: 'status',
      value: status,
      expected: validStatuses.join(', ')
    });
  }
  
  return status as QueueStatusType;
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any potential script tags or HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validate estimated minutes for notification
 */
export function validateEstimatedMinutes(minutes: number): void {
  const validMinutes = [5, 10, 15, 20];
  
  if (!validMinutes.includes(minutes)) {
    throw createQueueError('INVALID_INPUT', {
      field: 'estimatedMinutes',
      value: minutes,
      expected: validMinutes.join(', ')
    });
  }
}

/**
 * Middleware to validate request body fields
 */
export function validateRequestBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          throw createQueueError('MISSING_REQUIRED_FIELD', {
            field,
            message: `${field} is required`
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate queue ID parameter
 */
export function validateQueueIdParam(req: Request, res: Response, next: NextFunction) {
  try {
    validateQueueId(req.params.id);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate salon ID parameter
 */
export function validateSalonIdParam(req: Request, res: Response, next: NextFunction) {
  try {
    validateSalonId(req.params.salonId);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate user ID parameter
 */
export function validateUserIdParam(req: Request, res: Response, next: NextFunction) {
  try {
    validateUserId(req.params.userId);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate location data in request body
 */
export function validateLocationBody(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    // Location is optional, but if provided, must be valid
    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        throw createQueueError('INVALID_INPUT', {
          message: 'Both latitude and longitude are required when providing location'
        });
      }
      
      validateLocation(latitude, longitude, accuracy);
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Sanitize all string fields in request body
 */
export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}
