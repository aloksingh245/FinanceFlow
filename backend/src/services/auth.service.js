const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const usersRepository = require('../repositories/users.repository');
const rolesRepository = require('../repositories/roles.repository');
const auditService = require('../audit/audit.service');
const AUDIT_ACTIONS = require('../audit/audit.actions');
const { withTransaction } = require('../config/db');
const logger = require('../utils/logger');
const { recordLoginFailure, clearLoginAttempts } = require('../middleware/rateLimiter');

class AuthService {
  async register(name, email, password, roleName, ipAddress, reqId) {
    const role = await rolesRepository.findByName(roleName || 'viewer');
    if (!role) {
      logger.error(`Register failed: System role '${roleName}' missing from DB`, { requestId: reqId });
      throw { statusCode: 500, message: 'Internal Server Error: Role configuration error' };
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    
    return await withTransaction(reqId, async (client) => {
      try {
        const user = await usersRepository.createUser(client, name, email, passwordHash, role.id);
        user.role = role.name;
        await auditService.logAction(client, user.id, AUDIT_ACTIONS.REGISTER, 'users', user.id, ipAddress, reqId);
        logger.info(`User registered successfully: ${email}`, { userId: user.id, requestId: reqId });
        return user;
      } catch (error) {
        if (error.code === '23505') {
          logger.error(`Register failed: Email already exists '${email}'`, { requestId: reqId });
          throw { statusCode: 409, message: 'Email already exists' };
        }
        logger.error(`Register failed: Internal error for '${email}'`, { error: error.message, requestId: reqId });
        throw error;
      }
    });
  }

  async login(email, password, ipAddress, reqId) {
    logger.info(`Login attempt for email: ${email}`, { requestId: reqId });
    const user = await usersRepository.findByEmail(email);
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      recordLoginFailure(email);
      await auditService.logAction(null, user?.id, AUDIT_ACTIONS.LOGIN_FAILED, 'users', user?.id, ipAddress, reqId);
      logger.warn(`Login failed: Invalid credentials for email: ${email}`, { userId: user?.id, requestId: reqId });
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'active') {
      recordLoginFailure(email);
      await auditService.logAction(null, user.id, AUDIT_ACTIONS.LOGIN_FAILED, 'users', user.id, ipAddress, reqId);
      logger.warn(`Login failed: Inactive account for email: ${email}`, { userId: user.id, requestId: reqId });
      throw { statusCode: 403, message: 'Account is inactive' };
    }

    return await withTransaction(reqId, async (client) => {
      clearLoginAttempts(email); // reset lockout on successful login
      await usersRepository.updateLastLogin(client, user.id);
      await auditService.logAction(client, user.id, AUDIT_ACTIONS.LOGIN, 'users', user.id, ipAddress, reqId);

      const token = jwt.sign(
        { user_id: user.id, role: user.role, token_version: user.token_version },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRY }
      );

      logger.info(`Login successful for email: ${email}`, { userId: user.id, requestId: reqId });
      return token;
    });
  }

  async logout(userId, ipAddress, reqId) {
    try {
      await withTransaction(reqId, async (client) => {
        await usersRepository.incrementTokenVersion(client, userId);
        await auditService.logAction(client, userId, AUDIT_ACTIONS.LOGOUT, 'users', userId, ipAddress, reqId);
      });
      logger.info(`Logout successful for user`, { userId, requestId: reqId });
    } catch (error) {
      logger.error(`Logout failed for user`, { error: error.message, userId, requestId: reqId });
      throw error;
    }
  }
}

module.exports = new AuthService();