"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
// Import database utilities
const db_1 = require("./utils/db");
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
const PORT = parseInt(process.env.PORT || '3000', 10);
// Initialize database connection pool
(0, db_1.initializePool)();
// Ensure uploads directory exists
(0, db_1.ensureUploadsDir)();
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration - Allow all origins for Railway deployment
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await (0, db_1.testConnection)();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Material Management API',
            database: dbConnected ? 'connected' : 'disconnected',
            environment: process.env.NODE_ENV || 'development'
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'Material Management API',
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
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
// Initialize database and start server
const startServer = async () => {
    try {
        console.log('🔄 Starting Material Management API...');
        // Test database connection
        const dbConnected = await (0, db_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        // Initialize database schema
        await (0, db_1.initializeDatabase)();
        // Start server on 0.0.0.0 for Railway
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Material Management API server running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Database: PostgreSQL connected`);
            console.log(`📁 Uploads Directory: ${process.env.UPLOAD_DIR || './uploads'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    const { DatabaseHelper } = await Promise.resolve().then(() => __importStar(require('./utils/db')));
    await DatabaseHelper.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    const { DatabaseHelper } = await Promise.resolve().then(() => __importStar(require('./utils/db')));
    await DatabaseHelper.close();
    process.exit(0);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map