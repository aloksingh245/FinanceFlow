const app = require('./app');
const logger = require('./utils/logger');
const env = require('./config/env');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
  } else {
    logger.error('Server error', { error: err.message });
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});