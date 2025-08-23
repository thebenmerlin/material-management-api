"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("../controllers/orders.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const siteIsolation_middleware_1 = require("../middleware/siteIsolation.middleware");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
/**
 * @route POST /api/orders
 * @desc Create new order from approved indent
 * @access Private (Purchase Team only)
 */
router.post('/', auth_middleware_1.authenticateToken, role_middleware_1.requirePurchaseTeam, (0, validation_1.validate)(validation_1.updateOrderSchema), orders_controller_1.OrdersController.createOrder);
/**
 * @route GET /api/orders
 * @desc Get orders with filtering and pagination
 * @access Private (All roles with site isolation)
 */
router.get('/', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, siteIsolation_middleware_1.enforceSiteIsolation, orders_controller_1.OrdersController.getOrders);
/**
 * @route GET /api/orders/:id
 * @desc Get order by ID with items
 * @access Private (All roles with site isolation)
 */
router.get('/:id', auth_middleware_1.authenticateToken, role_middleware_1.requireAnyRole, orders_controller_1.OrdersController.getOrderById);
/**
 * @route PUT /api/orders/:id
 * @desc Update order details (vendor, pricing)
 * @access Private (Purchase Team only)
 */
router.put('/:id', auth_middleware_1.authenticateToken, role_middleware_1.requirePurchaseTeam, (0, validation_1.validate)(validation_1.updateOrderSchema), orders_controller_1.OrdersController.updateOrder);
exports.default = router;
//# sourceMappingURL=orders.routes.js.map