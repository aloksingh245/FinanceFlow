const usersRepository = require('../repositories/users.repository');
const auditService = require('../audit/audit.service');
const AUDIT_ACTIONS = require('../audit/audit.actions');
const { withTransaction } = require('../config/db');
const logger = require('../utils/logger');

class UsersService {
  async getAllUsers(page = 1, limit = 20, search = '') {
    try {
      const data = await usersRepository.findAll(page, limit, search);
      const total = await usersRepository.countAll(search);
      
      return {
        data,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          hasMore: (page * limit) < total
        }
      };
    } catch (error) {
      logger.error('Error fetching all users', { error: error.message });
      throw error;
    }
  }

  async getUserById(targetId, requesterId, hasManageUsers) {
    if (targetId !== requesterId && !hasManageUsers) {
      throw { statusCode: 403, message: 'Forbidden: Insufficient permissions' };
    }
    return this.getUserProfile(targetId);
  }

  async getUserProfile(userId) {
    try {
      const user = await usersRepository.findById(userId);
      if (!user) {
        logger.warn(`User profile not found for ID: ${userId}`);
        throw { statusCode: 404, message: 'User not found' };
      }
      return user;
    } catch (error) {
      logger.error('Error fetching user profile', { userId, error: error.message });
      throw error;
    }
  }

  async updateStatus(requesterId, targetId, status, ipAddress, reqId) {
    if (requesterId === targetId) {
      throw { statusCode: 403, message: 'Cannot perform this action on your own account' };
    }
    try {
      return await withTransaction(reqId, async (client) => {
        const user = await usersRepository.updateStatus(client, targetId, status);
        if (!user) {
          logger.warn(`Cannot update status: User not found for ID: ${targetId}`, { requestId: reqId });
          throw { statusCode: 404, message: 'User not found' };
        }
        
        await auditService.logAction(client, requesterId, AUDIT_ACTIONS.UPDATE_STATUS, 'users', targetId, ipAddress, reqId);
        logger.info(`User status updated to ${status} for ID: ${targetId}`, { requestId: reqId });
        return user;
      });
    } catch (error) {
      if (error.statusCode !== 403 && error.statusCode !== 404) {
        logger.error('Error updating user status', { targetId, status, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }

  async deleteUser(requesterId, targetId, ipAddress, reqId) {
    if (requesterId === targetId) {
      throw { statusCode: 403, message: 'Cannot perform this action on your own account' };
    }
    try {
      return await withTransaction(reqId, async (client) => {
        const user = await usersRepository.deleteUser(client, targetId);
        if (!user) {
          throw { statusCode: 404, message: 'User not found' };
        }
        await auditService.logAction(client, requesterId, AUDIT_ACTIONS.DELETE_USER, 'users', targetId, ipAddress, reqId);
        logger.info(`User deleted successfully for ID: ${targetId}`, { requestId: reqId });
        return user;
      });
    } catch (error) {
      if (error.statusCode !== 403 && error.statusCode !== 404) {
        logger.error('Error deleting user', { targetId, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }
}

module.exports = new UsersService();