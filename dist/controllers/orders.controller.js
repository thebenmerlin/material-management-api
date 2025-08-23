"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const db_1 = require("../utils/db");
const siteIsolation_middleware_1 = require("../middleware/siteIsolation.middleware");
class OrdersController {
    static async createOrder(req, res) {
        try {
            const { indent_id, vendor_name, vendor_contact, vendor_address, expected_delivery_date, items } = req.body;
            const user = req.user;
            // Only Purchase Team can create orders
            if (user.role !== 'Purchase Team') {
                res.status(403).json({ error: 'Only Purchase Team can create orders' });
                return;
            }
            // Check if indent exists and is approved by director
            const indent = db_1.DatabaseHelper.getOne('SELECT * FROM indents WHERE id = ? AND status = ?', [indent_id, 'Director Approved']);
            if (!indent) {
                res.status(404).json({ error: 'Indent not found or not approved by director' });
                return;
            }
            // Check if order already exists for this indent
            const existingOrder = db_1.DatabaseHelper.getOne('SELECT id FROM orders WHERE indent_id = ?', [indent_id]);
            if (existingOrder) {
                res.status(400).json({ error: 'Order already exists for this indent' });
                return;
            }
            // Generate order number
            const orderNumber = `ORD-${indent_id}-${Date.now()}`;
            // Calculate total amount
            let totalAmount = 0;
            for (const item of items) {
                totalAmount += item.quantity * item.unit_price;
            }
            db_1.DatabaseHelper.transaction(() => {
                // Insert order
                const orderResult = db_1.DatabaseHelper.executeInsert(`INSERT INTO orders (indent_id, order_number, vendor_name, vendor_contact, vendor_address, 
                                       order_date, expected_delivery_date, total_amount, created_by) 
                     VALUES (?, ?, ?, ?, ?, DATE('now'), ?, ?, ?)`, [indent_id, orderNumber, vendor_name, vendor_contact, vendor_address,
                    expected_delivery_date, totalAmount, user.id]);
                const orderId = orderResult.lastInsertRowid;
                // Insert order items
                for (const item of items) {
                    const totalPrice = item.quantity * item.unit_price;
                    db_1.DatabaseHelper.executeInsert(`INSERT INTO order_items (order_id, material_id, quantity, unit_price, total_price, specifications) 
                         VALUES (?, ?, ?, ?, ?, ?)`, [
                        orderId,
                        item.material_id,
                        item.quantity,
                        item.unit_price,
                        totalPrice,
                        item.specifications ? JSON.stringify(item.specifications) : null
                    ]);
                }
            });
            res.status(201).json({
                message: 'Order created successfully',
                order_number: orderNumber
            });
        }
        catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateOrder(req, res) {
        try {
            const { id } = req.params;
            const { vendor_name, vendor_contact, vendor_address, expected_delivery_date, items } = req.body;
            const user = req.user;
            // Only Purchase Team can update orders
            if (user.role !== 'Purchase Team') {
                res.status(403).json({ error: 'Only Purchase Team can update orders' });
                return;
            }
            // Check if order exists
            const order = db_1.DatabaseHelper.getOne('SELECT * FROM orders WHERE id = ?', [id]);
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            // Calculate new total amount
            let totalAmount = 0;
            for (const item of items) {
                totalAmount += item.quantity * item.unit_price;
            }
            db_1.DatabaseHelper.transaction(() => {
                // Update order
                db_1.DatabaseHelper.executeUpdate(`UPDATE orders 
                     SET vendor_name = ?, vendor_contact = ?, vendor_address = ?, 
                         expected_delivery_date = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`, [vendor_name, vendor_contact, vendor_address, expected_delivery_date, totalAmount, id]);
                // Delete existing order items
                db_1.DatabaseHelper.executeUpdate('DELETE FROM order_items WHERE order_id = ?', [id]);
                // Insert updated order items
                for (const item of items) {
                    const totalPrice = item.quantity * item.unit_price;
                    db_1.DatabaseHelper.executeInsert(`INSERT INTO order_items (order_id, material_id, quantity, unit_price, total_price, specifications) 
                         VALUES (?, ?, ?, ?, ?, ?)`, [
                        id,
                        item.material_id,
                        item.quantity,
                        item.unit_price,
                        totalPrice,
                        item.specifications ? JSON.stringify(item.specifications) : null
                    ]);
                }
            });
            res.json({ message: 'Order updated successfully' });
        }
        catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getOrders(req, res) {
        try {
            const user = req.user;
            const { status, limit = 50, offset = 0 } = req.query;
            let query = `
                SELECT 
                    o.*,
                    i.indent_number,
                    s.site_name,
                    s.site_code,
                    u.full_name as created_by_name
                FROM orders o
                JOIN indents i ON o.indent_id = i.id
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON o.created_by = u.id
                WHERE 1=1
            `;
            const params = [];
            // Site isolation for Site Engineers
            if (user.role === 'Site Engineer') {
                query += ` AND i.site_id = ?`;
                params.push(user.site_id);
            }
            // Status filter
            if (status) {
                query += ` AND o.status = ?`;
                params.push(status);
            }
            // Add ordering and pagination
            query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
            params.push(Number(limit), Number(offset));
            const orders = db_1.DatabaseHelper.executeQuery(query, params);
            // Hide pricing information for Site Engineers
            const filteredOrders = orders.map((order) => {
                if (user.role === 'Site Engineer') {
                    const { total_amount, ...orderWithoutPricing } = order;
                    return orderWithoutPricing;
                }
                return order;
            });
            res.json({ orders: filteredOrders });
        }
        catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            // Get order with details
            const order = db_1.DatabaseHelper.getOne(`SELECT 
                    o.*,
                    i.indent_number,
                    i.site_id,
                    s.site_name,
                    s.site_code,
                    u.full_name as created_by_name
                FROM orders o
                JOIN indents i ON o.indent_id = i.id
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON o.created_by = u.id
                WHERE o.id = ?`, [id]);
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            // Check site access
            if (!(0, siteIsolation_middleware_1.validateSiteAccess)(req, order.site_id)) {
                res.status(403).json({ error: 'Access denied to this order' });
                return;
            }
            // Get order items
            const items = db_1.DatabaseHelper.executeQuery(`SELECT 
                    oi.*,
                    m.material_name,
                    m.material_code,
                    m.unit,
                    m.category
                FROM order_items oi
                JOIN materials m ON oi.material_id = m.id
                WHERE oi.order_id = ?`, [id]);
            // Parse specifications and filter pricing for Site Engineers
            const itemsWithSpecs = items.map((item) => {
                const processedItem = {
                    ...item,
                    specifications: item.specifications ? JSON.parse(item.specifications) : {}
                };
                // Hide pricing information for Site Engineers
                if (user.role === 'Site Engineer') {
                    const { unit_price, total_price, ...itemWithoutPricing } = processedItem;
                    return itemWithoutPricing;
                }
                return processedItem;
            });
            // Hide pricing information for Site Engineers
            let responseOrder = order;
            if (user.role === 'Site Engineer') {
                const { total_amount, ...orderWithoutPricing } = order;
                responseOrder = orderWithoutPricing;
            }
            res.json({
                order: responseOrder,
                items: itemsWithSpecs
            });
        }
        catch (error) {
            console.error('Get order by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.OrdersController = OrdersController;
//# sourceMappingURL=orders.controller.js.map