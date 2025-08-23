import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

// Specific role middleware functions
export const requireSiteEngineer = requireRole(['Site Engineer']);
export const requirePurchaseTeam = requireRole(['Purchase Team']);
export const requireDirector = requireRole(['Director']);
export const requirePurchaseOrDirector = requireRole(['Purchase Team', 'Director']);
export const requireAnyRole = requireRole(['Site Engineer', 'Purchase Team', 'Director']);
