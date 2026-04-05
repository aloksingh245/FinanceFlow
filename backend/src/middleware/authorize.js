const { error: apiError, ERROR_CODES } = require('../utils/apiResponse');
const { hasPermission } = require('../policies/rbac.policy');

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, requiredPermission)) {
      req.logger.warn('Forbidden access attempt', { userId: req.user?.id, requiredPermission, userRole: req.user?.role });
      return apiError(res, 403, ERROR_CODES.FORBIDDEN, 'Forbidden: Insufficient permissions');
    }
    next();
  };
};

module.exports = authorize;