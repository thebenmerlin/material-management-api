import { Response } from 'express';
import ExcelJS from 'exceljs';
import { DatabaseHelper } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReportsController {
    static async generateMonthlyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { year, month, site_id } = req.query;
            const user = req.user!;

            // Only Purchase Team and Director can generate reports
            if (user.role === 'Site Engineer') {
                res.status(403).json({ error: 'Access denied. Only Purchase Team and Director can generate reports.' });
                return;
            }

            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

            let siteFilter = '';
            const params: any[] = [startDate, endDate];

            // Site filter
            if (site_id) {
                siteFilter = ' AND i.site_id = ?';
                params.push(site_id);
            }

            // Get monthly indent data
            const indentData = DatabaseHelper.executeQuery(
                `SELECT 
                    i.id,
                    i.indent_number,
                    i.status,
                    i.total_estimated_cost,
                    i.created_at,
                    s.site_name,
                    s.site_code,
                    u.full_name as created_by_name,
                    o.order_number,
                    o.total_amount as actual_cost,
                    o.vendor_name
                FROM indents i
                JOIN sites s ON i.site_id = s.id
                JOIN users u ON i.created_by = u.id
                LEFT JOIN orders o ON i.id = o.indent_id
                WHERE DATE(i.created_at) BETWEEN ? AND ? ${siteFilter}
                ORDER BY i.created_at DESC`,
                params
            );

            // Get material-wise summary
            const materialSummary = DatabaseHelper.executeQuery(
                `SELECT 
                    m.material_name,
                    m.category,
                    SUM(ii.quantity) as total_quantity,
                    m.unit,
                    AVG(oi.unit_price) as avg_unit_price,
                    SUM(oi.total_price) as total_cost
                FROM indent_items ii
                JOIN indents i ON ii.indent_id = i.id
                JOIN materials m ON ii.material_id = m.id
                LEFT JOIN order_items oi ON m.id = oi.material_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.indent_id = i.id
                WHERE DATE(i.created_at) BETWEEN ? AND ? ${siteFilter}
                GROUP BY m.id, m.material_name, m.category, m.unit
                ORDER BY total_cost DESC`,
                params
            );

            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            
            // Indent Summary Sheet
            const indentSheet = workbook.addWorksheet('Indent Summary');
            
            // Add headers
            indentSheet.columns = [
                { header: 'Indent Number', key: 'indent_number', width: 15 },
                { header: 'Site', key: 'site_name', width: 20 },
                { header: 'Created By', key: 'created_by_name', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created Date', key: 'created_at', width: 12 },
                { header: 'Estimated Cost', key: 'total_estimated_cost', width: 15 },
                { header: 'Order Number', key: 'order_number', width: 15 },
                { header: 'Actual Cost', key: 'actual_cost', width: 15 },
                { header: 'Vendor', key: 'vendor_name', width: 20 }
            ];

            // Style headers
            indentSheet.getRow(1).font = { bold: true };
            indentSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data
            indentData.forEach((row: any) => {
                indentSheet.addRow({
                    indent_number: row.indent_number,
                    site_name: row.site_name,
                    created_by_name: row.created_by_name,
                    status: row.status,
                    created_at: new Date(row.created_at).toLocaleDateString(),
                    total_estimated_cost: row.total_estimated_cost || 0,
                    order_number: row.order_number || 'N/A',
                    actual_cost: row.actual_cost || 0,
                    vendor_name: row.vendor_name || 'N/A'
                });
            });

            // Material Summary Sheet
            const materialSheet = workbook.addWorksheet('Material Summary');
            
            materialSheet.columns = [
                { header: 'Material Name', key: 'material_name', width: 25 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Total Quantity', key: 'total_quantity', width: 15 },
                { header: 'Unit', key: 'unit', width: 10 },
                { header: 'Avg Unit Price', key: 'avg_unit_price', width: 15 },
                { header: 'Total Cost', key: 'total_cost', width: 15 }
            ];

            // Style headers
            materialSheet.getRow(1).font = { bold: true };
            materialSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data
            materialSummary.forEach((row: any) => {
                materialSheet.addRow({
                    material_name: row.material_name,
                    category: row.category,
                    total_quantity: row.total_quantity,
                    unit: row.unit,
                    avg_unit_price: row.avg_unit_price || 0,
                    total_cost: row.total_cost || 0
                });
            });

            // Summary Sheet
            const summarySheet = workbook.addWorksheet('Summary');
            
            // Calculate totals
            const totalIndents = indentData.length;
            const totalEstimatedCost = indentData.reduce((sum: number, row: any) => sum + (row.total_estimated_cost || 0), 0);
            const totalActualCost = indentData.reduce((sum: number, row: any) => sum + (row.actual_cost || 0), 0);
            const completedIndents = indentData.filter((row: any) => row.status === 'Completed').length;

            // Add summary data
            summarySheet.addRow(['Monthly Report Summary']);
            summarySheet.addRow(['Report Period:', `${month}/${year}`]);
            summarySheet.addRow(['Generated On:', new Date().toLocaleDateString()]);
            summarySheet.addRow(['Generated By:', user.full_name]);
            summarySheet.addRow([]);
            summarySheet.addRow(['Total Indents:', totalIndents]);
            summarySheet.addRow(['Completed Indents:', completedIndents]);
            summarySheet.addRow(['Completion Rate:', `${totalIndents > 0 ? ((completedIndents / totalIndents) * 100).toFixed(1) : 0}%`]);
            summarySheet.addRow(['Total Estimated Cost:', totalEstimatedCost]);
            summarySheet.addRow(['Total Actual Cost:', totalActualCost]);
            summarySheet.addRow(['Cost Variance:', totalActualCost - totalEstimatedCost]);

            // Style summary sheet
            summarySheet.getCell('A1').font = { bold: true, size: 14 };
            summarySheet.getColumn('A').width = 20;
            summarySheet.getColumn('B').width = 20;

            // Set response headers for file download
            const filename = `Monthly_Report_${year}_${String(month).padStart(2, '0')}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Write to response
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Generate monthly report error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getReportData(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { year, month, site_id } = req.query;
            const user = req.user!;

            // Only Purchase Team and Director can access report data
            if (user.role === 'Site Engineer') {
                res.status(403).json({ error: 'Access denied. Only Purchase Team and Director can access reports.' });
                return;
            }

            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

            let siteFilter = '';
            const params: any[] = [startDate, endDate];

            if (site_id) {
                siteFilter = ' AND i.site_id = ?';
                params.push(site_id);
            }

            // Get summary statistics
            const stats = DatabaseHelper.getOne(
                `SELECT 
                    COUNT(*) as total_indents,
                    COUNT(CASE WHEN i.status = 'Completed' THEN 1 END) as completed_indents,
                    COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pending_indents,
                    COUNT(CASE WHEN i.status LIKE '%Approved%' THEN 1 END) as approved_indents,
                    SUM(i.total_estimated_cost) as total_estimated_cost,
                    SUM(o.total_amount) as total_actual_cost
                FROM indents i
                LEFT JOIN orders o ON i.id = o.indent_id
                WHERE DATE(i.created_at) BETWEEN ? AND ? ${siteFilter}`,
                params
            );

            // Get status breakdown
            const statusBreakdown = DatabaseHelper.executeQuery(
                `SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(total_estimated_cost) as total_cost
                FROM indents i
                WHERE DATE(i.created_at) BETWEEN ? AND ? ${siteFilter}
                GROUP BY status`,
                params
            );

            // Get top materials by cost
            const topMaterials = DatabaseHelper.executeQuery(
                `SELECT 
                    m.material_name,
                    m.category,
                    SUM(ii.quantity) as total_quantity,
                    m.unit,
                    SUM(oi.total_price) as total_cost
                FROM indent_items ii
                JOIN indents i ON ii.indent_id = i.id
                JOIN materials m ON ii.material_id = m.id
                LEFT JOIN order_items oi ON m.id = oi.material_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.indent_id = i.id
                WHERE DATE(i.created_at) BETWEEN ? AND ? ${siteFilter}
                GROUP BY m.id, m.material_name, m.category, m.unit
                HAVING total_cost > 0
                ORDER BY total_cost DESC
                LIMIT 10`,
                params
            );

            res.json({
                period: { year, month },
                stats: {
                    total_indents: stats?.total_indents || 0,
                    completed_indents: stats?.completed_indents || 0,
                    pending_indents: stats?.pending_indents || 0,
                    approved_indents: stats?.approved_indents || 0,
                    total_estimated_cost: stats?.total_estimated_cost || 0,
                    total_actual_cost: stats?.total_actual_cost || 0,
                    completion_rate: stats?.total_indents > 0 ? 
                        ((stats.completed_indents / stats.total_indents) * 100).toFixed(1) : '0'
                },
                status_breakdown: statusBreakdown,
                top_materials: topMaterials
            });

        } catch (error) {
            console.error('Get report data error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
