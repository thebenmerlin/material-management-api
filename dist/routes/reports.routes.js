"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
/**
 * @route GET /api/reports/monthly
 * @desc Generate and download monthly Excel report
 * @access Private (Purchase Team and Director only)
 */
router.get('/monthly', auth_middleware_1.authenticateToken, role_middleware_1.requirePurchaseOrDirector, (0, validation_1.validateQuery)(validation_1.monthlyReportSchema), reports_controller_1.ReportsController.generateMonthlyReport);
/**
 * @route GET /api/reports/data
 * @desc Get monthly report data (JSON format)
 * @access Private (Purchase Team and Director only)
 */
router.get('/data', auth_middleware_1.authenticateToken, role_middleware_1.requirePurchaseOrDirector, (0, validation_1.validateQuery)(validation_1.monthlyReportSchema), reports_controller_1.ReportsController.getReportData);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map