import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './db/material_management.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
// Explicitly typing as "any" to avoid BetterSqlite3.Database export error
const db: any = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;

// Database helper functions
export class DatabaseHelper {
    static executeQuery(query: string, params: any[] = []): any {
        try {
            const stmt = db.prepare(query);
            return stmt.all(params);
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    static executeInsert(query: string, params: any[] = []): any {
        try {
            const stmt = db.prepare(query);
            return stmt.run(params);
        } catch (error) {
            console.error('Database insert error:', error);
            throw error;
        }
    }

    static executeUpdate(query: string, params: any[] = []): any {
        try {
            const stmt = db.prepare(query);
            return stmt.run(params);
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }

    static getOne(query: string, params: any[] = []): any {
        try {
            const stmt = db.prepare(query);
            return stmt.get(params);
        } catch (error) {
            console.error('Database get one error:', error);
            throw error;
        }
    }

    static transaction(callback: () => void): void {
        const transaction = db.transaction(callback);
        transaction();
    }

    static close(): void {
        db.close();
    }
}

// Initialize database with schema
export const initializeDatabase = (): void => {
    try {
        const schemaPath = path.join(__dirname, '../../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        
        statements.forEach(statement => {
            db.exec(statement);
        });

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};
