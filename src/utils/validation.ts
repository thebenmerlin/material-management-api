import Joi from 'joi';

// Auth validation schemas
export const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    site_code: Joi.string().alphanum().min(3).max(20).optional()
});

// Material validation schemas
export const materialSearchSchema = Joi.object({
    search: Joi.string().min(1).max(100).optional(),
    category: Joi.string().max(50).optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
});

// Indent validation schemas
export const createIndentSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            material_id: Joi.number().integer().positive().required(),
            quantity: Joi.number().positive().required(),
            specifications: Joi.object().optional(),
            estimated_unit_cost: Joi.number().positive().optional()
        })
    ).min(1).required()
});

export const approveIndentSchema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    rejection_reason: Joi.string().when('action', {
        is: 'reject',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Order validation schemas
export const updateOrderSchema = Joi.object({
    vendor_name: Joi.string().max(255).required(),
    vendor_contact: Joi.string().max(255).required(),
    vendor_address: Joi.string().max(500).optional(),
    expected_delivery_date: Joi.date().iso().min('now').required(),
    items: Joi.array().items(
        Joi.object({
            material_id: Joi.number().integer().positive().required(),
            quantity: Joi.number().positive().required(),
            unit_price: Joi.number().positive().required(),
            specifications: Joi.object().optional()
        })
    ).min(1).required()
});

// Receipt validation schemas
export const createReceiptSchema = Joi.object({
    order_id: Joi.number().integer().positive().required(),
    delivery_challan_number: Joi.string().max(100).optional(),
    received_date: Joi.date().iso().max('now').required(),
    is_partial: Joi.boolean().default(false),
    notes: Joi.string().max(500).optional(),
    items: Joi.array().items(
        Joi.object({
            order_item_id: Joi.number().integer().positive().required(),
            received_quantity: Joi.number().min(0).required(),
            damaged_quantity: Joi.number().min(0).default(0),
            returned_quantity: Joi.number().min(0).default(0),
            damage_description: Joi.string().max(500).optional(),
            return_reason: Joi.string().max(500).optional(),
            condition_notes: Joi.string().max(500).optional()
        })
    ).min(1).required()
});

// Report validation schemas
export const monthlyReportSchema = Joi.object({
    year: Joi.number().integer().min(2020).max(2030).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    site_id: Joi.number().integer().positive().optional()
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: any, res: any, next: any) => {
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

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: any, res: any, next: any) => {
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
