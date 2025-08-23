"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const indents_controller_1 = require("../controllers/indents.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const siteIsolation_middleware_1 = require("../middleware/siteIsolation.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
/**
 * @route POST /api/indents
 * @desc Create new indent
 * @access Private (Site Engineer only)
 */
router.post('/', auth_middleware_1.authenticateToken, role_middleware_1.requireSiteEngineer, (0, validation_1.validate)(validation_1.createIndentSchema), indents_controller_1.IndentsController.createIndent);
/**
 * @route GET /api/indents
 * @desc Get indents with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get('/', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, siteIsolation_middleware_1.enforceSiteIsolation, indents_controller_1.IndentsController.getIndents);
/**
 * @route GET /api/indents/:id
 * @desc Get indent by ID with items
 * @access Private (All roles with site isolation)
 */
router.get('/:id', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, indents_controller_1.IndentsController.getIndentById);
/**
 * @route PUT /api/indents/:id/approve
 * @desc Approve or reject indent (two-tier approval)
 * @access Private (Purchase Team for first approval, Director for final approval)
 */
router.put('/:id/approve', auth_middleware_1.authenticateToken, (req, res, next) => {
    // Dynamic role checking based on approval workflow
    const user = req.user;
    if (user?.role === 'Purchase Team' || user?.role === 'Director') {
        next();
    }
    else {
        res.status(403).json({ error: 'Only Purchase Team and Director can approve indents' });
    }
}, (0, validation_1.validate)(validation_1.approveIndentSchema), indents_controller_1.IndentsController.approveIndent);
exports.default = router;
//# sourceMappingURL=indents.routes.js.map