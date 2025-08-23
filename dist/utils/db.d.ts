declare const db: any;
export default db;
export declare class DatabaseHelper {
    static executeQuery(query: string, params?: any[]): any;
    static executeInsert(query: string, params?: any[]): any;
    static executeUpdate(query: string, params?: any[]): any;
    static getOne(query: string, params?: any[]): any;
    static transaction(callback: () => void): void;
    static close(): void;
}
export declare const initializeDatabase: () => void;
//# sourceMappingURL=db.d.ts.map