import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePurchaseTeam, requireAnyRole } from '../middleware/role.middleware';
import { enforceSiteIsolation } from '../middleware/siteIsolation.middleware';
import { validate, updateOrderSchema } from '../utils/validation';

const router = Router();

/**
 * @route POST /api/orders
 * @desc Create new order from approved indent
 * @access Private (Purchase Team only)
 */
router.post(
    '/',
    authenticateToken,
    requirePurchaseTeam,
    validate(updateOrderSchema),
    OrdersController.createOrder
);

/**
 * @route GET /api/orders
 * @desc Get orders with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get(
    '/',
    authenticateToken,
    requireAnyRole,
    enforceSiteIsolation,
    OrdersController.getOrders
);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID with items
 * @access Private (All roles with site isolation)
 */
router.get(
    '/:id',
    authenticateToken,
    requireAnyRole,
    OrdersController.getOrderById
);

/**
 * @route PUT /api/orders/:id
 * @desc Update order details (vendor, pricing)
 * @access Private (Purchase Team only)
 */
router.put(
    '/:id',
    authenticateToken,
    requirePurchaseTeam,
    validate(updateOrderSchema),
    OrdersController.updateOrder
);

export default router;
