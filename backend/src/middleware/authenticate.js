const jwt = require('jsonwebtoken');
const env = require('../config/env');
const usersRepository = require('../repositories/users.repository');
const { error: apiError, ERROR_CODES } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError(res, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await usersRepository.findById(decoded.user_id);
    
    if (!user) {
      return apiError(res, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }

    if (user.token_version !== decoded.token_version) {
      return apiError(res, 401, ERROR_CODES.TOKEN_INVALIDATED, 'Token invalidated');
    }

    if (user.status !== 'active') {
      return apiError(res, 403, ERROR_CODES.ACCOUNT_INACTIVE, 'Account is inactive');
    }

    req.user = user;
    req.tokenPayload = decoded;
    req.logger = req.logger.child({ userId: user.id });
    next();
  } catch (error) {
    req.logger.error('Authentication error', { error: error.message });
    return apiError(res, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
  }
};

module.exports = authenticate;