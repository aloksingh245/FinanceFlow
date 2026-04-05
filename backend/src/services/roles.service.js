const rolesRepository = require('../repositories/roles.repository');
const auditService = require('../audit/audit.service');
const AUDIT_ACTIONS = require('../audit/audit.actions');
const { withTransaction } = require('../config/db');
const logger = require('../utils/logger');

class RolesService {
  async getRoles() {
    try {
      return await rolesRepository.getRoles();
    } catch (error) {
      logger.error('Error fetching roles', { error: error.message });
      throw error;
    }
  }

  async updateRole(userId, roleId, permissions, ipAddress, reqId) {
    try {
      return await withTransaction(reqId, async (client) => {
        const updatedRole = await rolesRepository.updateRole(client, roleId, permissions);
        if (!updatedRole) {
          logger.warn(`Update role failed: Role not found for ID: ${roleId}`, { requestId: reqId });
          throw { statusCode: 404, message: 'Role not found' };
        }
        
        await auditService.logAction(client, userId, AUDIT_ACTIONS.UPDATE_ROLE, 'roles', roleId, ipAddress, reqId);
        logger.info(`Role ${roleId} updated successfully`, { requestId: reqId, userId });
        return updatedRole;
      });
    } catch (error) {
      logger.error('Error updating role', { roleId, error: error.message, requestId: reqId });
      throw error;
    }
  }
}

module.exports = new RolesService();