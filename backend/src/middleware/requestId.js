const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  req.requestId = reqId;
  res.set('x-request-id', reqId);
  
  req.logger = logger.child({ requestId: reqId });
  next();
};

module.exports = requestIdMiddleware;