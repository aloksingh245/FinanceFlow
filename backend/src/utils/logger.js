const winston = require('winston');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, requestId, userId, service, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (requestId) msg += ` [reqId:${requestId}]`;
  if (userId) msg += ` [userId:${userId}]`;
  msg += `: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const isDevelopment = env.NODE_ENV === 'development';

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    timestamp(),
    isDevelopment ? combine(colorize(), customFormat) : json()
  ),
  defaultMeta: { service: 'finance-data-platform' },
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = logger;