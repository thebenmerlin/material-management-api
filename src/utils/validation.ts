import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6).required()
}).xor('username', 'email'); // require username OR email

export const validate = (schema: Joi.ObjectSchema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
};