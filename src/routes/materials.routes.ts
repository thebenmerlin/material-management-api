import { Router } from 'express';
import { MaterialsController } from '../controllers/materials.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAnyRole } from '../middleware/role.middleware';
import { validateQuery, materialSearchSchema } from '../utils/validation';

const router = Router();

/**
 * @route GET /api/materials
 * @desc Get materials catalog with search and filtering
 * @access Private (All roles)
 */
router.get(
    '/',
    authenticateToken,
    requireAnyRole,
    validateQuery(materialSearchSchema),
    MaterialsController.getMaterials
);

/**
 * @route GET /api/materials/categories
 * @desc Get all material categories
 * @access Private (All roles)
 */
router.get(
    '/categories',
    authenticateToken,
    requireAnyRole,
    MaterialsController.getCategories
);

/**
 * @route GET /api/materials/:id
 * @desc Get material by ID
 * @access Private (All roles)
 */
router.get(
    '/:id',
    authenticateToken,
    requireAnyRole,
    MaterialsController.getMaterialById
);

export default router;
