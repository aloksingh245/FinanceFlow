const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const requestIdMiddleware = require('./middleware/requestId');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const v1Routes = require('./routes');
const setupSwagger = require('./utils/swagger');

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN
}));
app.use(generalLimiter);
app.use(express.json());

app.use(requestIdMiddleware);

// Log incoming requests
app.use((req, res, next) => {
  if (req.logger) {
    req.logger.info(`Incoming request: ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/v1', v1Routes);

// Setup Swagger (Disabled in production)
if (env.NODE_ENV !== 'production' && setupSwagger) {
  setupSwagger(app);
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;