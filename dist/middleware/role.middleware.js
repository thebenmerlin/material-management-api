"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requirePurchaseOrDirector = exports.requireDirector = exports.requirePurchaseTeam = exports.requireSiteEngineer = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// Specific role middleware functions
exports.requireSiteEngineer = (0, exports.requireRole)(['Site Engineer']);
exports.requirePurchaseTeam = (0, exports.requireRole)(['Purchase Team']);
exports.requireDirector = (0, exports.requireRole)(['Director']);
exports.requirePurchaseOrDirector = (0, exports.requireRole)(['Purchase Team', 'Director']);
exports.requireAnyRole = (0, exports.requireRole)(['Site Engineer', 'Purchase Team', 'Director']);
//# sourceMappingURL=role.middleware.js.map