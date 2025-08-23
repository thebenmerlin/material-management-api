"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const materials_routes_1 = __importDefault(require("./routes/materials.routes"));
const indents_routes_1 = __importDefault(require("./routes/indents.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const receipts_routes_1 = __importDefault(require("./routes/receipts.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
// Import middleware
const upload_middleware_1 = require("./middleware/upload.middleware");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8081',
    'exp://192.168.1.100:8081'
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Material Management API'
    });
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/materials', materials_routes_1.default);
app.use('/api/indents', indents_routes_1.default);
app.use('/api/orders', orders_routes_1.default);
app.use('/api/receipts', receipts_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
// Serve uploaded files
app.get('/uploads/:filename', upload_middleware_1.serveUploads);
// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Material Management API',
        version: '1.0.0',
        description: 'API for construction site material management',
        endpoints: {
            auth: {
                'POST /api/auth/login': 'User authentication',
                'POST /api/auth/logout': 'User logout',
                'POST /api/auth/refresh': 'Refresh token'
            },
            materials: {
                'GET /api/materials': 'Get materials catalog',
                'GET /api/materials/categories': 'Get material categories',
                'GET /api/materials/:id': 'Get material by ID'
            },
            indents: {
                'POST /api/indents': 'Create new indent (Site Engineer)',
                'GET /api/indents': 'Get indents with filtering',
                'GET /api/indents/:id': 'Get indent details',
                'PUT /api/indents/:id/approve': 'Approve/reject indent'
            },
            orders: {
                'POST /api/orders': 'Create order (Purchase Team)',
                'GET /api/orders': 'Get orders with filtering',
                'GET /api/orders/:id': 'Get order details',
                'PUT /api/orders/:id': 'Update order (Purchase Team)'
            },
            receipts: {
                'POST /api/receipts': 'Create receipt with images (Site Engineer)',
                'GET /api/receipts': 'Get receipts with filtering',
                'GET /api/receipts/:id': 'Get receipt details',
                'GET /api/receipts/dashboard/stats': 'Get dashboard statistics'
            },
            reports: {
                'GET /api/reports/monthly': 'Download monthly Excel report',
                'GET /api/reports/data': 'Get monthly report data (JSON)'
            }
        },
        authentication: 'Bearer token required for all endpoints except /api/auth/login',
        roles: ['Site Engineer', 'Purchase Team', 'Director']
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Database constraint violation' });
    }
    // Default error response
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Material Management API server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map