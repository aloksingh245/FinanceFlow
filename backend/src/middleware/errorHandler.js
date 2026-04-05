const { error: apiError, ERROR_CODES } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Internal Server Error';
  let details = err.details || [];

  // PostgreSQL specific errors
  if (err.code === '22P02') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid data format (e.g., malformed UUID)';
  } else if (err.code === '23505') {
    statusCode = 409;
    code = ERROR_CODES.CONFLICT;
    message = 'Conflict: Duplicate record';
  }

  // Map other status codes to constants
  switch (statusCode) {
    case 400:
      code = ERROR_CODES.VALIDATION_ERROR;
      break;
    case 401:
      code = message === 'Token invalidated' ? ERROR_CODES.TOKEN_INVALIDATED : ERROR_CODES.UNAUTHORIZED;
      break;
    case 403:
      code = message === 'Account is inactive' ? ERROR_CODES.ACCOUNT_INACTIVE : ERROR_CODES.FORBIDDEN;
      break;
    case 404:
      code = ERROR_CODES.NOT_FOUND;
      break;
    case 409:
      code = ERROR_CODES.CONFLICT;
      break;
  }

  const logPayload = { 
    stack: err.stack, 
    statusCode, 
    pgCode: err.code,
    errorCode: code 
  };

  if (req.logger) {
    req.logger.error(message, logPayload);
  } else {
    logger.error(message, logPayload);
  }

  apiError(res, statusCode, code, statusCode === 500 ? 'Internal Server Error' : message, details);
};

module.exports = errorHandler;