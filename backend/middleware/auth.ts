import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartq-secret-key';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}

/**
 * Middleware for JWT authentication
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            role?: 'customer' | 'salon_owner';
        };

        // Set default role if missing
        const role: string = decoded.role || 'customer';

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token', error: err });
    }
};
