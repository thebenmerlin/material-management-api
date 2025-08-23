import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class IndentsController {
    static createIndent(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getIndents(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getIndentById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static approveIndent(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=indents.controller.d.ts.map