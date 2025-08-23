import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
export declare const enforceSiteIsolation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const getSiteFilter: (user: any) => string;
export declare const validateSiteAccess: (req: AuthenticatedRequest, siteId: number) => boolean;
//# sourceMappingURL=siteIsolation.middleware.d.ts.map