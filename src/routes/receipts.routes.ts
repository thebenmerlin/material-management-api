import { Router } from 'express';
import { ReceiptsController } from '../controllers/receipts.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireSiteEngineer, requireAnyRole } from '../middleware/role.middleware';
import { enforceSiteIsolation } from '../middleware/siteIsolation.middleware';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware';
import { validate, createReceiptSchema } from '../utils/validation';

const router = Router();

/**
 * @route POST /api/receipts
 * @desc Create receipt with image uploads
 * @access Private (Site Engineer only)
 */
router.post(
    '/',
    authenticateToken,
    requireSiteEngineer,
    uploadMultiple,
    handleUploadError,
    validate(createReceiptSchema),
    ReceiptsController.createReceipt
);

/**
 * @route GET /api/receipts
 * @desc Get receipts with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get(
    '/',
    authenticateToken,
    requireAnyRole,
    enforceSiteIsolation,
    ReceiptsController.getReceipts
);

/**
 * @route GET /api/receipts/:id
 * @desc Get receipt by ID with items and images
 * @access Private (All roles with site isolation)
 */
router.get(
    '/:id',
    authenticateToken,
    requireAnyRole,
    ReceiptsController.getReceiptById
);

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (All roles with site isolation)
 */
router.get(
    '/dashboard/stats',
    authenticateToken,
    requireAnyRole,
    enforceSiteIsolation,
    ReceiptsController.getDashboardStats
);

export default router;
