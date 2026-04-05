const Joi = require('joi');

const querySchema = Joi.object({
  from: Joi.date().iso().allow('', null),
  to: Joi.date().iso().allow('', null)
});

module.exports = { querySchema };