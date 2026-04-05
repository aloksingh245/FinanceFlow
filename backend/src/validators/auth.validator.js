const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(12)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*()\-_=+[\]{};':",.<>?/\\|`~]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, a digit, and a special character'
    }),
  role: Joi.string().valid('viewer', 'analyst', 'admin').default('viewer')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };