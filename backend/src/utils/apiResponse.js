const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOKEN_INVALIDATED: 'TOKEN_INVALIDATED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE'
};

const success = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    data: data && data.data !== undefined ? data.data : data,
    message: message || undefined
  };

  if (data && data.pagination) {
    response.pagination = data.pagination;
  }

  res.status(statusCode).json(response);
};

const error = (res, statusCode, code, message, details = []) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: details || []
    }
  });
};

module.exports = { success, error, ERROR_CODES };