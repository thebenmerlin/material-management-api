import { Response } from 'express';
import { DatabaseHelper } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateSiteAccess } from '../middleware/siteIsolation.middleware';

export class OrdersController {
    static async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { indent_id, vendor_name, vendor_contact, vendor_address, expected_delivery_date, items } = req.body;
            const user = req.user!;

            // Only Purchase Team can create orders
            if (user.role !== 'Purchase Team') {
                res.status(403).json({ error: 'Only Purchase Team can create orders' });
                return;
            }

            // Check if indent exists and is approved by director
            const indent = await DatabaseHelper.getOne(
                'SELECT * FROM indents WHERE id = $1 AND status = $2',
                [indent_id, 'Director Approved']
            );

            if (!indent) {
                res.status(404).json({ error: 'Indent not found or not approved by director' });
                return;
            }

            // Check if order already exists for this indent
            const existingOrder = await DatabaseHelper.getOne(
                'SELECT id FROM orders WHERE indent_id = $1',
                [indent_id]
            );

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

            await DatabaseHelper.transaction(async (client) => {
                // Insert order
                const orderResult = await client.query(
                    `INSERT INTO orders (indent_id, order_number, vendor_name, vendor_contact, vendor_address, 
                                       order_date, expected_delivery_date, total_amount, created_by) 
                     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8) RETURNING id`,
                    [indent_id, orderNumber, vendor_name, vendor_contact, vendor_address, 
                     expected_delivery_date, totalAmount, user.id]
                );

                const orderId = orderResult.rows[0].id;

                // Insert order items
                for (const item of items) {
                    const totalPrice = item.quantity * item.unit_price;

                    await client.query(
                        `INSERT INTO order_items (order_id, material_id, quantity, unit_price, total_price, specifications) 
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            orderId,
                            item.material_id,
                            item.quantity,
                            item.unit_price,
                            totalPrice,
                            item.specifications ? JSON.stringify(item.specifications) : null
                        ]
                    );
                }
            });

            res.status(201).json({
                message: 'Order created successfully',
                order_number: orderNumber
            });

        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async updateOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { vendor_name, vendor_contact, vendor_address, expected_delivery_date, items } = req.body;
            const user = req.user!;

            // Only Purchase Team can update orders
            if (user.role !== 'Purchase Team') {
                res.status(403).json({ error: 'Only Purchase Team can update orders' });
                return;
            }

            // Check if order exists
            const order = await DatabaseHelper.getOne(
                'SELECT * FROM orders WHERE id = $1',
                [id]
            );

            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            // Calculate new total amount
            let totalAmount = 0;
            for (const item of items) {
                totalAmount += item.quantity * item.unit_price;
            }

            await DatabaseHelper.transaction(async (client) => {
                // Update order
                await client.query(
                    `UPDATE orders 
                     SET vendor_name = $1, vendor_contact = $2, vendor_address = $3, 
                         expected_delivery_date = $4, total_amount = $5, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $6`,
                    [vendor_name, vendor_contact, vendor_address, expected_delivery_date, totalAmount, id]
                );

                // Delete existing order items
                await client.query(
                    'DELETE FROM order_items WHERE order_id = $1',
                    [id]
                );

                // Insert updated order items
                for (const item of items) {
                    const totalPrice = item.quantity * item.unit_price;

                    await client.query(
                        `INSERT INTO order_items (order_id, material_id, quantity, unit_price, total_price, specifications) 
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            id,
                            item.material_id,
                            item.quantity,
                            item.unit_price,
                            totalPrice,
                            item.specifications ? JSON.stringify(item.specifications) : null
                        ]
                    );
                }
            });

            res.json({ message: 'Order updated successfully' });

        } catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
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

            const params: any[] = [];

            let paramIndex = 1;

            // Site isolation for Site Engineers
            if (user.role === 'Site Engineer') {
                query += ` AND i.site_id = $${paramIndex}`;
                params.push(user.site_id);
                paramIndex++;
            }

            // Status filter
            if (status) {
                query += ` AND o.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            // Add ordering and pagination
            query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(Number(limit), Number(offset));

            const orders = await DatabaseHelper.executeQuery(query, params);

            // Hide pricing information for Site Engineers
            const filteredOrders = orders.map((order: any) => {
                if (user.role === 'Site Engineer') {
                    const { total_amount, ...orderWithoutPricing } = order;
                    return orderWithoutPricing;
                }
                return order;
            });

            res.json({ orders: filteredOrders });

        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = req.user!;

            // Get order with details
            const order = await DatabaseHelper.getOne(
                `SELECT 
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
                WHERE o.id = $1`,
                [id]
            );

            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            // Check site access
            if (!validateSiteAccess(req, order.site_id)) {
                res.status(403).json({ error: 'Access denied to this order' });
                return;
            }

            // Get order items
            const items = await DatabaseHelper.executeQuery(
                `SELECT 
                    oi.*,
                    m.material_name,
                    m.material_code,
                    m.unit,
                    m.category
                FROM order_items oi
                JOIN materials m ON oi.material_id = m.id
                WHERE oi.order_id = $1`,
                [id]
            );

            // Parse specifications and filter pricing for Site Engineers
            const itemsWithSpecs = items.map((item: any) => {
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

        } catch (error) {
            console.error('Get order by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
