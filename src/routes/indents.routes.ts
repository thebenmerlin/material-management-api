import { Request } from "express";

interface AuthRequest extends Request {
  user?: any;  // or replace `any` with your actual User type
}

import { Router } from 'express';
import { IndentsController } from '../controllers/indents.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireSiteEngineer, requirePurchaseTeam, requireDirector, requireAnyRole } from '../middleware/role.middleware';
import { enforceSiteIsolation } from '../middleware/siteIsolation.middleware';
import { validate, createIndentSchema, approveIndentSchema } from '../utils/validation';

const router = Router();

/**
 * @route POST /api/indents
 * @desc Create new indent
 * @access Private (Site Engineer only)
 */
router.post(
    '/',
    authenticateToken,
    requireSiteEngineer,
    validate(createIndentSchema),
    IndentsController.createIndent
);

/**
 * @route GET /api/indents
 * @desc Get indents with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get(
    '/',
    authenticateToken,
    requireAnyRole,
    enforceSiteIsolation,
    IndentsController.getIndents
);

/**
 * @route GET /api/indents/:id
 * @desc Get indent by ID with items
 * @access Private (All roles with site isolation)
 */
router.get(
    '/:id',
    authenticateToken,
    requireAnyRole,
    IndentsController.getIndentById
);

/**
 * @route PUT /api/indents/:id/approve
 * @desc Approve or reject indent (two-tier approval)
 * @access Private (Purchase Team for first approval, Director for final approval)
 */
router.put(
    '/:id/approve',
    authenticateToken,
    (req, res, next) => {
        // Dynamic role checking based on approval workflow
        const user = (req as AuthRequest).user;

        if (user?.role === 'Purchase Team' || user?.role === 'Director') {
            next();
        } else {
            res.status(403).json({ error: 'Only Purchase Team and Director can approve indents' });
        }
    },
    validate(approveIndentSchema),
    IndentsController.approveIndent
);

export default router;
