import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class ReceiptsController {
    static createReceipt(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getReceipts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getReceiptById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=receipts.controller.d.ts.map