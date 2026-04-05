const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authLimiter, checkLoginLockout } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authLimiter);

router.post('/register', validate(registerSchema), asyncWrapper(authController.register));
router.post('/login', checkLoginLockout, validate(loginSchema), asyncWrapper(authController.login));
router.post('/logout', authenticate, asyncWrapper(authController.logout));

module.exports = router;