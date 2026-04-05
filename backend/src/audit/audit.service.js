const auditRepository = require('./audit.repository');

class AuditService {
  async logAction(client, userId, action, entity, entityId, ipAddress, requestId) {
    await auditRepository.insertLog(client, userId, action, entity, entityId, ipAddress, requestId);
  }
}

module.exports = new AuditService();