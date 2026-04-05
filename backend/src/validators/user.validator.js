const Joi = require('joi');

const updateUserSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive')
});

module.exports = { updateUserSchema };