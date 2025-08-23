import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class ReportsController {
    static generateMonthlyReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getReportData(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=reports.controller.d.ts.map