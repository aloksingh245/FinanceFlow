const { pool } = require('../config/db');
const { success } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');

class AuditController {
  async getLogs(req, res) {
    const { page, limit } = getPaginationParams(req.query);
    const { user_id, action, from, to, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause += ` AND a.user_id = $${paramIndex++}`;
      params.push(user_id);
    }
    if (action) {
      whereClause += ` AND a.action = $${paramIndex++}`;
      params.push(action);
    }
    if (from) {
      whereClause += ` AND a.timestamp >= $${paramIndex++}`;
      params.push(from);
    }
    if (to) {
      whereClause += ` AND a.timestamp <= $${paramIndex++}`;
      params.push(to);
    }
    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR a.action ILIKE $${paramIndex})`;
      paramIndex++;
      params.push(`%${search}%`);
    }

    const baseFrom = `FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereClause}`;

    const countResult = await pool.query(`SELECT COUNT(a.id) ${baseFrom}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT a.id, a.user_id,
             u.name  AS user_name,
             u.email AS user_email,
             a.action, a.entity, a.entity_id,
             a.ip_address, a.request_id, a.timestamp
      ${baseFrom}
      ORDER BY a.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    const dataParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const result = await pool.query(dataQuery, dataParams);

    success(res, 200, {
      data: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        hasMore: (page * limit) < total
      }
    }, 'Audit logs retrieved');
  }
}

module.exports = new AuditController();
