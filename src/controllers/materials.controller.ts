import { Response } from 'express';
import { DatabaseHelper } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class MaterialsController {
    static async getMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { search, category, limit = 50, offset = 0 } = req.query;

            let query = `
                SELECT 
                    id,
                    material_code,
                    material_name,
                    category,
                    unit,
                    specifications,
                    description,
                    created_at
                FROM materials 
                WHERE is_active = 1
            `;
            
            const params: any[] = [];

            // Add search filter
            if (search) {
                query += ` AND (
                    material_name LIKE ? OR 
                    material_code LIKE ? OR 
                    category LIKE ? OR
                    description LIKE ?
                )`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Add category filter
            if (category) {
                query += ` AND category = ?`;
                params.push(category);
            }

            // Add ordering and pagination
            query += ` ORDER BY material_name ASC LIMIT ? OFFSET ?`;
            params.push(Number(limit), Number(offset));

            const materials = DatabaseHelper.executeQuery(query, params);

            // Parse specifications JSON for each material
            const materialsWithSpecs = materials.map((material: any) => ({
                ...material,
                specifications: material.specifications ? JSON.parse(material.specifications) : {}
            }));

            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM materials 
                WHERE is_active = 1
            `;
            const countParams: any[] = [];

            if (search) {
                countQuery += ` AND (
                    material_name LIKE ? OR 
                    material_code LIKE ? OR 
                    category LIKE ? OR
                    description LIKE ?
                )`;
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (category) {
                countQuery += ` AND category = ?`;
                countParams.push(category);
            }

            const countResult = DatabaseHelper.getOne(countQuery, countParams);
            const total = countResult?.total || 0;

            res.json({
                materials: materialsWithSpecs,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < total
                }
            });

        } catch (error) {
            console.error('Get materials error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getMaterialById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const material = DatabaseHelper.getOne(
                `SELECT 
                    id,
                    material_code,
                    material_name,
                    category,
                    unit,
                    specifications,
                    description,
                    created_at
                FROM materials 
                WHERE id = ? AND is_active = 1`,
                [id]
            );

            if (!material) {
                res.status(404).json({ error: 'Material not found' });
                return;
            }

            // Parse specifications JSON
            const materialWithSpecs = {
                ...material,
                specifications: material.specifications ? JSON.parse(material.specifications) : {}
            };

            res.json({ material: materialWithSpecs });

        } catch (error) {
            console.error('Get material by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const categories = DatabaseHelper.executeQuery(
                `SELECT DISTINCT category 
                FROM materials 
                WHERE is_active = 1 AND category IS NOT NULL 
                ORDER BY category ASC`
            );

            res.json({
                categories: categories.map((row: any) => row.category)
            });

        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
