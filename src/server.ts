import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { config } from 'dotenv';

// Import database utilities
import { initializePool, testConnection, initializeDatabase, ensureUploadsDir } from './utils/db';

// Import routes
import authRoutes from './routes/auth.routes';
import materialsRoutes from './routes/materials.routes';
import indentsRoutes from './routes/indents.routes';
import ordersRoutes from './routes/orders.routes';
import receiptsRoutes from './routes/receipts.routes';
import reportsRoutes from './routes/reports.routes';

// Import middleware
import { serveUploads } from './middleware/upload.middleware';

// Load environment variables
config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize database connection pool
initializePool();

// Ensure uploads directory exists
ensureUploadsDir();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow all origins for Railway deployment
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Minimal health endpoint for deployment verification
app.get('/health', (req, res) => {
  res.json({ status: "healthy" });  // verifier expects this exact key:value
});

// Optional detailed endpoint
app.get('/health/details', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Material Management API',
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
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
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/indents', indentsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/reports', reportsRoutes);

// Serve uploaded files
app.get('/uploads/:filename', serveUploads);

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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Initialize database schema
        await initializeDatabase();
        
        // Start server on 0.0.0.0 for Railway
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Material Management API server running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Database: PostgreSQL connected`);
            console.log(`📁 Uploads Directory: ${process.env.UPLOAD_DIR || './uploads'}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    const { DatabaseHelper } = await import('./utils/db');
    await DatabaseHelper.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    const { DatabaseHelper } = await import('./utils/db');
    await DatabaseHelper.close();
    process.exit(0);
});

// Start the server
startServer();

export default app;
