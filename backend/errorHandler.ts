import type { Request, Response, NextFunction } from 'express';
import { QueueError } from './errors/QueueError';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Handle QueueError (queue management specific errors)
  if (err instanceof QueueError) {
    const response: any = {
      status: 'error',
      error: err.code,
      message: err.userMessage,
      retryable: err.retryable
    };
    
    // Include details in development mode
    if (process.env.NODE_ENV === 'development' && err.details) {
      response.details = err.details;
    }
    
    // Add retry-after header for rate limit errors
    if (err.statusCode === 429) {
      res.setHeader('Retry-After', '300'); // 5 minutes in seconds
    }
    
    return res.status(err.statusCode).json(response);
  }
  
  // Default error values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate field value entered'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Your token has expired. Please log in again.'
    });
  }
  
  // Production vs development error response
  if (process.env.NODE_ENV === 'production') {
    // Don't leak error details in production
    if (statusCode === 500) {
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
    
    return res.status(statusCode).json({
      status: 'error',
      message
    });
  } else {
    // Send detailed error in development
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
      error: err
    });
  }
};