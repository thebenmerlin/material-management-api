import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePurchaseOrDirector } from '../middleware/role.middleware';
import { validateQuery, monthlyReportSchema } from '../utils/validation';

const router = Router();

/**
 * @route GET /api/reports/monthly
 * @desc Generate and download monthly Excel report
 * @access Private (Purchase Team and Director only)
 */
router.get(
    '/monthly',
    authenticateToken,
    requirePurchaseOrDirector,
    validateQuery(monthlyReportSchema),
    ReportsController.generateMonthlyReport
);

/**
 * @route GET /api/reports/data
 * @desc Get monthly report data (JSON format)
 * @access Private (Purchase Team and Director only)
 */
router.get(
    '/data',
    authenticateToken,
    requirePurchaseOrDirector,
    validateQuery(monthlyReportSchema),
    ReportsController.getReportData
);

export default router;
