const Joi = require('joi');

const updateRoleSchema = Joi.object({
  permissions_json: Joi.object().required()
});

module.exports = { updateRoleSchema };