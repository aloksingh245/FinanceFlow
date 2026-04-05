const { pool } = require('../config/db');

class AuditRepository {
  async insertLog(client, userId, action, entity, entityId, ipAddress, requestId) {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, request_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      userId !== undefined ? userId : null,
      action !== undefined ? action : null,
      entity !== undefined ? entity : null,
      entityId !== undefined ? entityId : null,
      ipAddress !== undefined ? ipAddress : null,
      requestId !== undefined ? requestId : null
    ];
    const dbClient = client || pool;
    await dbClient.query(query, values);
  }
}

module.exports = new AuditRepository();