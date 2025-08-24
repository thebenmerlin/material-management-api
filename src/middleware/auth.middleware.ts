import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseHelper } from '../utils/db';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        site_id: number | null;
        full_name: string;
    };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Fetch fresh user data from database
        const user = await DatabaseHelper.getOne(
            'SELECT id, username, role, site_id, full_name, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (!user || !user.is_active) {
            res.status(401).json({ error: 'Invalid or inactive user' });
            return;
        }

        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            site_id: user.site_id,
            full_name: user.full_name
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        } else {
            res.status(500).json({ error: 'Authentication error' });
        }
    }
};

export const generateToken = (userId: number): string => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};
