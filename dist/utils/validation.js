"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validate = exports.monthlyReportSchema = exports.createReceiptSchema = exports.updateOrderSchema = exports.approveIndentSchema = exports.createIndentSchema = exports.materialSearchSchema = exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Auth validation schemas
exports.loginSchema = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).required(),
    password: joi_1.default.string().min(6).required(),
    site_code: joi_1.default.string().alphanum().min(3).max(20).optional()
});
// Material validation schemas
exports.materialSearchSchema = joi_1.default.object({
    search: joi_1.default.string().min(1).max(100).optional(),
    category: joi_1.default.string().max(50).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).default(50),
    offset: joi_1.default.number().integer().min(0).default(0)
});
// Indent validation schemas
exports.createIndentSchema = joi_1.default.object({
    items: joi_1.default.array().items(joi_1.default.object({
        material_id: joi_1.default.number().integer().positive().required(),
        quantity: joi_1.default.number().positive().required(),
        specifications: joi_1.default.object().optional(),
        estimated_unit_cost: joi_1.default.number().positive().optional()
    })).min(1).required()
});
exports.approveIndentSchema = joi_1.default.object({
    action: joi_1.default.string().valid('approve', 'reject').required(),
    rejection_reason: joi_1.default.string().when('action', {
        is: 'reject',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
});
// Order validation schemas
exports.updateOrderSchema = joi_1.default.object({
    vendor_name: joi_1.default.string().max(255).required(),
    vendor_contact: joi_1.default.string().max(255).required(),
    vendor_address: joi_1.default.string().max(500).optional(),
    expected_delivery_date: joi_1.default.date().iso().min('now').required(),
    items: joi_1.default.array().items(joi_1.default.object({
        material_id: joi_1.default.number().integer().positive().required(),
        quantity: joi_1.default.number().positive().required(),
        unit_price: joi_1.default.number().positive().required(),
        specifications: joi_1.default.object().optional()
    })).min(1).required()
});
// Receipt validation schemas
exports.createReceiptSchema = joi_1.default.object({
    order_id: joi_1.default.number().integer().positive().required(),
    delivery_challan_number: joi_1.default.string().max(100).optional(),
    received_date: joi_1.default.date().iso().max('now').required(),
    is_partial: joi_1.default.boolean().default(false),
    notes: joi_1.default.string().max(500).optional(),
    items: joi_1.default.array().items(joi_1.default.object({
        order_item_id: joi_1.default.number().integer().positive().required(),
        received_quantity: joi_1.default.number().min(0).required(),
        damaged_quantity: joi_1.default.number().min(0).default(0),
        returned_quantity: joi_1.default.number().min(0).default(0),
        damage_description: joi_1.default.string().max(500).optional(),
        return_reason: joi_1.default.string().max(500).optional(),
        condition_notes: joi_1.default.string().max(500).optional()
    })).min(1).required()
});
// Report validation schemas
exports.monthlyReportSchema = joi_1.default.object({
    year: joi_1.default.number().integer().min(2020).max(2030).required(),
    month: joi_1.default.number().integer().min(1).max(12).required(),
    site_id: joi_1.default.number().integer().positive().optional()
});
// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({
                error: 'Query validation error',
                details: error.details.map(detail => detail.message)
            });
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map