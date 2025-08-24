// src/utils/db.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs';

// Database connection pool
let pool: Pool;

export const initializePool = (): Pool => {
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

    pool = new Pool({
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

// Get the pool instance
export const getPool = (): Pool => {
  if (!pool) {
    return initializePool();
  }
  return pool;
};

// Database helper function for queries
export const dbQuery = async (text: string, params: any[] = []): Promise<QueryResult> => {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executed:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Database helper class with async methods
export class DatabaseHelper {
  static async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    const result = await dbQuery(query, params);
    return result.rows;
  }

  static async executeInsert(query: string, params: any[] = []): Promise<any> {
    const result = await dbQuery(query, params);
    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount || 0,
      insertId: result.rows[0]?.id || null
    };
  }

  static async executeUpdate(query: string, params: any[] = []): Promise<any> {
    const result = await dbQuery(query, params);
    return {
      changes: result.rowCount || 0
    };
  }

  static async getOne(query: string, params: any[] = []): Promise<any> {
    const result = await dbQuery(query, params);
    return result.rows[0] || null;
  }

  static async transaction(callback: (client: PoolClient) => Promise<void>): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await callback(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(): Promise<void> {
    if (pool) {
      await pool.end();
      console.log('✅ Database connection pool closed');
    }
  }
}

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await dbQuery('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    const schemaPath = require('path').join(__dirname, '../../db/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      throw new Error('Schema file not found');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await dbQuery(statement);
      }
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
};

// Ensure uploads directory exists
export const ensureUploadsDir = (): void => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Uploads directory created:', uploadDir);
  }
};
