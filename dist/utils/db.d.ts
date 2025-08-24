import { Pool, PoolClient, QueryResult } from 'pg';
export declare const initializePool: () => Pool;
export declare const getPool: () => Pool;
export declare const dbQuery: (text: string, params?: any[]) => Promise<QueryResult>;
export declare class DatabaseHelper {
    static executeQuery(query: string, params?: any[]): Promise<any[]>;
    static executeInsert(query: string, params?: any[]): Promise<any>;
    static executeUpdate(query: string, params?: any[]): Promise<any>;
    static getOne(query: string, params?: any[]): Promise<any>;
    static transaction(callback: (client: PoolClient) => Promise<void>): Promise<void>;
    static close(): Promise<void>;
}
export declare const testConnection: () => Promise<boolean>;
export declare const initializeDatabase: () => Promise<void>;
export declare const ensureUploadsDir: () => void;
//# sourceMappingURL=db.d.ts.map