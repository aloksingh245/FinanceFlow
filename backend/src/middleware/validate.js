const { error: apiError, ERROR_CODES } = require('../utils/apiResponse');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return apiError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details);
    }
    req[property] = value;
    next();
  };
};

module.exports = validate;