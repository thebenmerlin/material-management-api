"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUploadsDir = exports.initializeDatabase = exports.testConnection = exports.DatabaseHelper = exports.dbQuery = exports.getPool = exports.initializePool = void 0;
// src/utils/db.ts
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
// Database connection pool
let pool;
const initializePool = () => {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            console.error('❌ DATABASE_URL environment variable is required');
            process.exit(1);
        }
        // Configure SSL for Railway
        const sslConfig = process.env.RAILWAY_STATIC_URL ? {
            ssl: {
                rejectUnauthorized: false
            }
        } : {};
        pool = new pg_1.Pool({
            connectionString,
            ...sslConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        // Handle pool errors
        pool.on('error', (err) => {
            console.error('❌ Unexpected error on idle client', err);
            process.exit(-1);
        });
        console.log('✅ PostgreSQL connection pool initialized');
    }
    return pool;
};
exports.initializePool = initializePool;
// Get the pool instance
const getPool = () => {
    if (!pool) {
        return (0, exports.initializePool)();
    }
    return pool;
};
exports.getPool = getPool;
// Database helper function for queries
const dbQuery = async (text, params = []) => {
    const pool = (0, exports.getPool)();
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Query executed:', { text, duration, rows: result.rowCount });
        }
        return result;
    }
    catch (error) {
        console.error('❌ Database query error:', error);
        console.error('Query:', text);
        console.error('Params:', params);
        throw error;
    }
};
exports.dbQuery = dbQuery;
// Database helper class with async methods
class DatabaseHelper {
    static async executeQuery(query, params = []) {
        const result = await (0, exports.dbQuery)(query, params);
        return result.rows;
    }
    static async executeInsert(query, params = []) {
        const result = await (0, exports.dbQuery)(query, params);
        return {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount || 0,
            insertId: result.rows[0]?.id || null
        };
    }
    static async executeUpdate(query, params = []) {
        const result = await (0, exports.dbQuery)(query, params);
        return {
            changes: result.rowCount || 0
        };
    }
    static async getOne(query, params = []) {
        const result = await (0, exports.dbQuery)(query, params);
        return result.rows[0] || null;
    }
    static async transaction(callback) {
        const pool = (0, exports.getPool)();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await callback(client);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async close() {
        if (pool) {
            await pool.end();
            console.log('✅ Database connection pool closed');
        }
    }
}
exports.DatabaseHelper = DatabaseHelper;
// Test database connection
const testConnection = async () => {
    try {
        const result = await (0, exports.dbQuery)('SELECT NOW() as current_time');
        console.log('✅ Database connection successful:', result.rows[0].current_time);
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Initialize database schema
const initializeDatabase = async () => {
    try {
        const schemaPath = require('path').join(__dirname, '../../db/schema.sql');
        if (!fs_1.default.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            throw new Error('Schema file not found');
        }
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Split schema by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        for (const statement of statements) {
            if (statement.trim()) {
                await (0, exports.dbQuery)(statement);
            }
        }
        console.log('✅ Database schema initialized successfully');
    }
    catch (error) {
        console.error('❌ Error initializing database schema:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
// Ensure uploads directory exists
const ensureUploadsDir = () => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        console.log('✅ Uploads directory created:', uploadDir);
    }
};
exports.ensureUploadsDir = ensureUploadsDir;
//# sourceMappingURL=db.js.map