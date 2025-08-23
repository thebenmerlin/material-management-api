import Joi from 'joi';
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const materialSearchSchema: Joi.ObjectSchema<any>;
export declare const createIndentSchema: Joi.ObjectSchema<any>;
export declare const approveIndentSchema: Joi.ObjectSchema<any>;
export declare const updateOrderSchema: Joi.ObjectSchema<any>;
export declare const createReceiptSchema: Joi.ObjectSchema<any>;
export declare const monthlyReportSchema: Joi.ObjectSchema<any>;
export declare const validate: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=validation.d.ts.map