const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().max(100).required(),
  date: Joi.date().iso().max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).required()
    .messages({
      'date.max': 'Date cannot be more than 1 year in the future'
    }),
  notes: Joi.string().max(500).allow('', null),
  idempotency_key: Joi.string().max(255).allow('', null)
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().max(100),
  date: Joi.date().iso().max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
    .messages({
      'date.max': 'Date cannot be more than 1 year in the future'
    }),
  notes: Joi.string().max(500).allow('', null),
  idempotency_key: Joi.string().max(255).allow('', null),
  updated_at: Joi.date().iso().required()
}).min(2);

module.exports = { createRecordSchema, updateRecordSchema };