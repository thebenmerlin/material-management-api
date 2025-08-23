"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.DatabaseHelper = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = process.env.DB_PATH || './db/material_management.db';
// Ensure database directory exists
const dbDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
// Initialize SQLite database
// Explicitly typing as "any" to avoid BetterSqlite3.Database export error
const db = new better_sqlite3_1.default(DB_PATH);
// Enable foreign keys
db.pragma('foreign_keys = ON');
exports.default = db;
// Database helper functions
class DatabaseHelper {
    static executeQuery(query, params = []) {
        try {
            const stmt = db.prepare(query);
            return stmt.all(params);
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
    static executeInsert(query, params = []) {
        try {
            const stmt = db.prepare(query);
            return stmt.run(params);
        }
        catch (error) {
            console.error('Database insert error:', error);
            throw error;
        }
    }
    static executeUpdate(query, params = []) {
        try {
            const stmt = db.prepare(query);
            return stmt.run(params);
        }
        catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }
    static getOne(query, params = []) {
        try {
            const stmt = db.prepare(query);
            return stmt.get(params);
        }
        catch (error) {
            console.error('Database get one error:', error);
            throw error;
        }
    }
    static transaction(callback) {
        const transaction = db.transaction(callback);
        transaction();
    }
    static close() {
        db.close();
    }
}
exports.DatabaseHelper = DatabaseHelper;
// Initialize database with schema
const initializeDatabase = () => {
    try {
        const schemaPath = path_1.default.join(__dirname, '../../db/schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Split schema by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        statements.forEach(statement => {
            db.exec(statement);
        });
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=db.js.map