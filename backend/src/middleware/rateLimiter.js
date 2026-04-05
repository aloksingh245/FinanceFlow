const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

// Per-IP rate limit for all auth endpoints
// 30 per 15 min is still brute-force resistant (per-email lockout is the primary guard)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
  message: 'Too many auth attempts, please try again later.'
});

// Per-email login lockout — prevents credential stuffing even through rotating proxies.
// Uses an in-memory Map (suitable for single-instance deployments).
// For multi-instance/Redis deployments, replace this with a Redis-backed counter.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map();

const getLoginRecord = (email) => {
  const record = loginAttempts.get(email);
  if (!record) return { attempts: 0, lockedUntil: 0 };
  return record;
};

const recordLoginFailure = (email) => {
  const record = getLoginRecord(email);
  record.attempts += 1;
  if (record.attempts >= LOGIN_MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }
  loginAttempts.set(email, record);
};

const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

const checkLoginLockout = (req, res, next) => {
  const email = req.body?.email?.toLowerCase?.();
  if (!email) return next();

  const record = getLoginRecord(email);
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const retryAfterSec = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    res.set('Retry-After', retryAfterSec);
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: `Account temporarily locked. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`
      }
    });
  }

  next();
};

module.exports = { generalLimiter, authLimiter, checkLoginLockout, recordLoginFailure, clearLoginAttempts };