"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../utils/db");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Fetch fresh user data from database
        const user = await db_1.DatabaseHelper.getOne('SELECT id, username, role, site_id, full_name, is_active FROM users WHERE id = $1', [decoded.userId]);
        if (!user || !user.is_active) {
            res.status(401).json({ error: 'Invalid or inactive user' });
            return;
        }
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            site_id: user.site_id,
            full_name: user.full_name
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        }
        else {
            res.status(500).json({ error: 'Authentication error' });
        }
    }
};
exports.authenticateToken = authenticateToken;
const generateToken = (userId) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.middleware.js.map