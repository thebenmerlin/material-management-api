import { Response } from 'express';
import { DatabaseHelper } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateSiteAccess } from '../middleware/siteIsolation.middleware';

export class IndentsController {
    static async createIndent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { items } = req.body;
            const user = req.user!;

            // Only Site Engineers can create indents
            if (user.role !== 'Site Engineer') {
                res.status(403).json({ error: 'Only Site Engineers can create indents' });
                return;
            }

            if (!user.site_id) {
                res.status(400).json({ error: 'Site Engineer must be assigned to a site' });
                return;
            }

            // Generate indent number
            const indentNumber = `IND-${user.site_id}-${Date.now()}`;

            // Calculate total estimated cost
            let totalEstimatedCost = 0;
            for (const item of items) {
                if (item.estimated_unit_cost) {
                    totalEstimatedCost += item.quantity * item.estimated_unit_cost;
                }
            }

            await DatabaseHelper.transaction(async (client) => {
                // Insert indent
                const indentResult = await client.query(
                    `INSERT INTO indents (indent_number, site_id, created_by, total_estimated_cost) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [indentNumber, user.site_id, user.id, totalEstimatedCost]
                );

                const indentId = indentResult.rows[0].id;

                // Insert indent items
                for (const item of items) {
                    const estimatedTotalCost = item.estimated_unit_cost ? 
                        item.quantity * item.estimated_unit_cost : null;

                    await client.query(
                        `INSERT INTO indent_items (indent_id, material_id, quantity, specifications, estimated_unit_cost, estimated_total_cost) 
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            indentId,
                            item.material_id,
                            item.quantity,
                            item.specifications ? JSON.stringify(item.specifications) : null,
                            item.estimated_unit_cost || null,
                            estimatedTotalCost
                        ]
                    );
                }
            });

            res.status(201).json({
                message: 'Indent created successfully',
                indent_number: indentNumber
            });

        } catch (error) {
            console.error('Create indent error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getIndents(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
            const { status, limit = 50, offset = 0 } = req.query;

            let query = `
                SELECT 
                    i.id,
                    i.indent_number,
                    i.status,
                    i.total_estimated_cost,
                    i.created_at,
                    i.updated_at,
                    s.site_name,
                    s.site_code,
                    u.full_name as created_by_name,
                    pu.full_name as purchase_approved_by_name,
                    du.full_name as director_approved_by_name,
                    i.rejection_reason
                FROM indents i
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON i.created_by = u.id
                LEFT JOIN users pu ON i.purchase_approved_by = pu.id
                LEFT JOIN users du ON i.director_approved_by = du.id
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
                query += ` AND i.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            // Add ordering and pagination
            query += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(Number(limit), Number(offset));

            const indents = await DatabaseHelper.executeQuery(query, params);

            res.json({ indents });

        } catch (error) {
            console.error('Get indents error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getIndentById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = req.user!;

            // Get indent with details
            const indent = await DatabaseHelper.getOne(
                `SELECT 
                    i.*,
                    s.site_name,
                    s.site_code,
                    u.full_name as created_by_name,
                    pu.full_name as purchase_approved_by_name,
                    du.full_name as director_approved_by_name
                FROM indents i
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON i.created_by = u.id
                LEFT JOIN users pu ON i.purchase_approved_by = pu.id
                LEFT JOIN users du ON i.director_approved_by = du.id
                WHERE i.id = $1`,
                [id]
            );

            if (!indent) {
                res.status(404).json({ error: 'Indent not found' });
                return;
            }

            // Check site access
            if (!validateSiteAccess(req, indent.site_id)) {
                res.status(403).json({ error: 'Access denied to this indent' });
                return;
            }

            // Get indent items
            const items = await DatabaseHelper.executeQuery(
                `SELECT 
                    ii.*,
                    m.material_name,
                    m.material_code,
                    m.unit,
                    m.category
                FROM indent_items ii
                JOIN materials m ON ii.material_id = m.id
                WHERE ii.indent_id = $1`,
                [id]
            );

            // Parse specifications for items
            const itemsWithSpecs = items.map((item: any) => ({
                ...item,
                specifications: item.specifications ? JSON.parse(item.specifications) : {}
            }));

            res.json({
                indent,
                items: itemsWithSpecs
            });

        } catch (error) {
            console.error('Get indent by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async approveIndent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { action, rejection_reason } = req.body;
            const user = req.user!;

            // Get current indent
            const indent = await DatabaseHelper.getOne(
                'SELECT * FROM indents WHERE id = $1',
                [id]
            );

            if (!indent) {
                res.status(404).json({ error: 'Indent not found' });
                return;
            }

            // Check site access
            if (!validateSiteAccess(req, indent.site_id)) {
                res.status(403).json({ error: 'Access denied to this indent' });
                return;
            }

            let newStatus: string;
            let updateQuery: string;
            let updateParams: any[];

            if (action === 'reject') {
                newStatus = 'Rejected';
                updateQuery = `
                    UPDATE indents 
                    SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = $3
                `;
                updateParams = [newStatus, rejection_reason, id];
            } else if (action === 'approve') {
                if (user.role === 'Purchase Team' && indent.status === 'Pending') {
                    newStatus = 'Purchase Approved';
                    updateQuery = `
                        UPDATE indents 
                        SET status = $1, purchase_approved_by = $2, purchase_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = $3
                    `;
                    updateParams = [newStatus, user.id, id];
                } else if (user.role === 'Director' && indent.status === 'Purchase Approved') {
                    newStatus = 'Director Approved';
                    updateQuery = `
                        UPDATE indents 
                        SET status = $1, director_approved_by = $2, director_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = $3
                    `;
                    updateParams = [newStatus, user.id, id];
                } else {
                    res.status(400).json({ error: 'Invalid approval workflow state' });
                    return;
                }
            } else {
                res.status(400).json({ error: 'Invalid action' });
                return;
            }

            await DatabaseHelper.executeUpdate(updateQuery, updateParams);

            res.json({
                message: `Indent ${action}d successfully`,
                new_status: newStatus
            });

        } catch (error) {
            console.error('Approve indent error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
