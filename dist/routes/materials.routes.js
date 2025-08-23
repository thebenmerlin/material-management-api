"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materials_controller_1 = require("../controllers/materials.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
/**
 * @route GET /api/materials
 * @desc Get materials catalog with search and filtering
 * @access Private (All roles)
 */
router.get('/', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, (0, validation_1.validateQuery)(validation_1.materialSearchSchema), materials_controller_1.MaterialsController.getMaterials);
/**
 * @route GET /api/materials/categories
 * @desc Get all material categories
 * @access Private (All roles)
 */
router.get('/categories', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, materials_controller_1.MaterialsController.getCategories);
/**
 * @route GET /api/materials/:id
 * @desc Get material by ID
 * @access Private (All roles)
 */
router.get('/:id', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, materials_controller_1.MaterialsController.getMaterialById);
exports.default = router;
//# sourceMappingURL=materials.routes.js.map