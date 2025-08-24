import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        site_id: number | null;
        full_name: string;
    };
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (userId: number) => string;
//# sourceMappingURL=auth.middleware.d.ts.map