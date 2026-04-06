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
const allowedOrigins = env.CORS_ORIGIN === '*' ? ['*'] : env.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGIN === '*') return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  }
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