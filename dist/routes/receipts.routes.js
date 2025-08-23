"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receipts_controller_1 = require("../controllers/receipts.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const siteIsolation_middleware_1 = require("../middleware/siteIsolation.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
/**
 * @route POST /api/receipts
 * @desc Create receipt with image uploads
 * @access Private (Site Engineer only)
 */
router.post('/', auth_middleware_1.authenticateToken, role_middleware_1.requireSiteEngineer, upload_middleware_1.uploadMultiple, upload_middleware_1.handleUploadError, (0, validation_1.validate)(validation_1.createReceiptSchema), receipts_controller_1.ReceiptsController.createReceipt);
/**
 * @route GET /api/receipts
 * @desc Get receipts with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get('/', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, siteIsolation_middleware_1.enforceSiteIsolation, receipts_controller_1.ReceiptsController.getReceipts);
/**
 * @route GET /api/receipts/:id
 * @desc Get receipt by ID with items and images
 * @access Private (All roles with site isolation)
 */
router.get('/:id', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, receipts_controller_1.ReceiptsController.getReceiptById);
/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (All roles with site isolation)
 */
router.get('/dashboard/stats', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, siteIsolation_middleware_1.enforceSiteIsolation, receipts_controller_1.ReceiptsController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=receipts.routes.js.map