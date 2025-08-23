"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptsController = void 0;
const db_1 = require("../utils/db");
const siteIsolation_middleware_1 = require("../middleware/siteIsolation.middleware");
class ReceiptsController {
    static async createReceipt(req, res) {
        try {
            const { order_id, delivery_challan_number, received_date, is_partial, notes, items } = req.body;
            const user = req.user;
            const files = req.files || [];
            // Only Site Engineers can create receipts
            if (user.role !== 'Site Engineer') {
                res.status(403).json({ error: 'Only Site Engineers can create receipts' });
                return;
            }
            // Check if order exists
            const order = db_1.DatabaseHelper.getOne(`SELECT o.*, i.site_id 
                 FROM orders o 
                 JOIN indents i ON o.indent_id = i.id 
                 WHERE o.id = ?`, [order_id]);
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            // Check site access
            if (!(0, siteIsolation_middleware_1.validateSiteAccess)(req, order.site_id)) {
                res.status(403).json({ error: 'Access denied to this order' });
                return;
            }
            // Generate receipt number
            const receiptNumber = `REC-${order_id}-${Date.now()}`;
            db_1.DatabaseHelper.transaction(() => {
                // Insert receipt
                const receiptResult = db_1.DatabaseHelper.executeInsert(`INSERT INTO receipts (order_id, receipt_number, received_by, received_date, 
                                         delivery_challan_number, is_partial, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`, [order_id, receiptNumber, user.id, received_date,
                    delivery_challan_number, is_partial ? 1 : 0, notes]);
                const receiptId = receiptResult.lastInsertRowid;
                // Insert receipt items
                for (const item of items) {
                    db_1.DatabaseHelper.executeInsert(`INSERT INTO receipt_items (receipt_id, order_item_id, received_quantity, 
                                                  damaged_quantity, returned_quantity, damage_description, 
                                                  return_reason, condition_notes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                        receiptId,
                        item.order_item_id,
                        item.received_quantity,
                        item.damaged_quantity || 0,
                        item.returned_quantity || 0,
                        item.damage_description || null,
                        item.return_reason || null,
                        item.condition_notes || null
                    ]);
                }
                // Insert receipt images
                files.forEach((file, index) => {
                    const imageType = req.body[`image_type_${index}`] || 'general';
                    const description = req.body[`image_description_${index}`] || '';
                    db_1.DatabaseHelper.executeInsert('INSERT INTO receipt_images (receipt_id, image_path, image_type, description) VALUES (?, ?, ?, ?)', [receiptId, file.path, imageType, description]);
                });
                // Update order status
                const allItemsReceived = items.every((item) => item.received_quantity + item.damaged_quantity + item.returned_quantity >= item.ordered_quantity);
                const newOrderStatus = allItemsReceived ? 'Completed' : 'Partially Received';
                db_1.DatabaseHelper.executeUpdate('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newOrderStatus, order_id]);
                // Update indent status if order is completed
                if (newOrderStatus === 'Completed') {
                    db_1.DatabaseHelper.executeUpdate('UPDATE indents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['Completed', order.indent_id]);
                }
            });
            res.status(201).json({
                message: 'Receipt created successfully',
                receipt_number: receiptNumber
            });
        }
        catch (error) {
            console.error('Create receipt error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getReceipts(req, res) {
        try {
            const user = req.user;
            const { order_id, limit = 50, offset = 0 } = req.query;
            let query = `
                SELECT 
                    r.*,
                    o.order_number,
                    i.indent_number,
                    s.site_name,
                    s.site_code,
                    u.full_name as received_by_name
                FROM receipts r
                JOIN orders o ON r.order_id = o.id
                JOIN indents i ON o.indent_id = i.id
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON r.received_by = u.id
                WHERE 1=1
            `;
            const params = [];
            // Site isolation for Site Engineers
            if (user.role === 'Site Engineer') {
                query += ` AND i.site_id = ?`;
                params.push(user.site_id);
            }
            // Order filter
            if (order_id) {
                query += ` AND r.order_id = ?`;
                params.push(order_id);
            }
            // Add ordering and pagination
            query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
            params.push(Number(limit), Number(offset));
            const receipts = db_1.DatabaseHelper.executeQuery(query, params);
            res.json({ receipts });
        }
        catch (error) {
            console.error('Get receipts error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getReceiptById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            // Get receipt with details
            const receipt = db_1.DatabaseHelper.getOne(`SELECT 
                    r.*,
                    o.order_number,
                    i.indent_number,
                    i.site_id,
                    s.site_name,
                    s.site_code,
                    u.full_name as received_by_name
                FROM receipts r
                JOIN orders o ON r.order_id = o.id
                JOIN indents i ON o.indent_id = i.id
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON r.received_by = u.id
                WHERE r.id = ?`, [id]);
            if (!receipt) {
                res.status(404).json({ error: 'Receipt not found' });
                return;
            }
            // Check site access
            if (!(0, siteIsolation_middleware_1.validateSiteAccess)(req, receipt.site_id)) {
                res.status(403).json({ error: 'Access denied to this receipt' });
                return;
            }
            // Get receipt items with material details
            const items = db_1.DatabaseHelper.executeQuery(`SELECT 
                    ri.*,
                    oi.quantity as ordered_quantity,
                    oi.unit_price,
                    oi.total_price,
                    m.material_name,
                    m.material_code,
                    m.unit,
                    m.category
                FROM receipt_items ri
                JOIN order_items oi ON ri.order_item_id = oi.id
                JOIN materials m ON oi.material_id = m.id
                WHERE ri.receipt_id = ?`, [id]);
            // Get receipt images
            const images = db_1.DatabaseHelper.executeQuery('SELECT * FROM receipt_images WHERE receipt_id = ?', [id]);
            // Filter pricing information for Site Engineers
            const filteredItems = items.map((item) => {
                if (user.role === 'Site Engineer') {
                    const { unit_price, total_price, ...itemWithoutPricing } = item;
                    return itemWithoutPricing;
                }
                return item;
            });
            res.json({
                receipt,
                items: filteredItems,
                images
            });
        }
        catch (error) {
            console.error('Get receipt by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            const user = req.user;
            let siteFilter = '';
            const params = [];
            // Site isolation for Site Engineers
            if (user.role === 'Site Engineer') {
                siteFilter = ' AND i.site_id = ?';
                params.push(user.site_id);
            }
            // Get indent statistics
            const indentStats = db_1.DatabaseHelper.executeQuery(`SELECT 
                    status,
                    COUNT(*) as count
                FROM indents i
                WHERE 1=1 ${siteFilter}
                GROUP BY status`, params);
            // Get recent activities (last 10 indents)
            const recentActivities = db_1.DatabaseHelper.executeQuery(`SELECT 
                    i.id,
                    i.indent_number,
                    i.status,
                    i.updated_at,
                    s.site_name,
                    u.full_name as created_by_name
                FROM indents i
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON i.created_by = u.id
                WHERE 1=1 ${siteFilter}
                ORDER BY i.updated_at DESC
                LIMIT 10`, params);
            res.json({
                indent_stats: indentStats,
                recent_activities: recentActivities
            });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ReceiptsController = ReceiptsController;
//# sourceMappingURL=receipts.controller.js.map