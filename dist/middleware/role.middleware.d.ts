import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
export declare const requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireSiteEngineer: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePurchaseTeam: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireDirector: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePurchaseOrDirector: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyRole: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map