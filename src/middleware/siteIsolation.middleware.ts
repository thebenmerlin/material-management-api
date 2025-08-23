import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const enforceSiteIsolation = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    // Site Engineers can only access their own site data
    if (req.user.role === 'Site Engineer' && !req.user.site_id) {
        res.status(403).json({ error: 'Site Engineer must be assigned to a site' });
        return;
    }

    // Add site filter to request for Site Engineers
    if (req.user.role === 'Site Engineer') {
        req.query.site_id = req.user.site_id?.toString();
    }

    // Purchase Team and Director can access all sites (no filtering needed)
    next();
};

export const getSiteFilter = (user: any): string => {
    if (user.role === 'Site Engineer' && user.site_id) {
        return ` AND site_id = ${user.site_id}`;
    }
    return ''; // No filter for Purchase Team and Director
};

export const validateSiteAccess = (req: AuthenticatedRequest, siteId: number): boolean => {
    if (!req.user) return false;
    
    // Purchase Team and Director can access all sites
    if (req.user.role === 'Purchase Team' || req.user.role === 'Director') {
        return true;
    }
    
    // Site Engineer can only access their assigned site
    if (req.user.role === 'Site Engineer') {
        return req.user.site_id === siteId;
    }
    
    return false;
};
