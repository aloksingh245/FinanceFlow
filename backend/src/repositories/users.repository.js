const { pool } = require('../config/db');

class UsersRepository {
  async createUser(client, name, email, passwordHash, roleId) {
    const query = `
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role_id, token_version, status, created_at
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [name, email, passwordHash, roleId]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = `
      SELECT u.id, u.name, u.email, u.password_hash, u.token_version, r.role_name as role, u.status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT u.id, u.name, u.email, u.token_version, r.role_name as role, u.status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let where = 'WHERE u.deleted_at IS NULL';
    if (search) {
      where += ` AND (u.name ILIKE $3 OR u.email ILIKE $3)`;
      params.push(`%${search}%`);
    }
    const query = `
      SELECT u.id, u.name, u.email, u.token_version, r.role_name as role, u.status, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async countAll(search = '') {
    let query = `SELECT COUNT(u.id) FROM users u WHERE u.deleted_at IS NULL`;
    const params = [];
    if (search) {
      query += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`;
      params.push(`%${search}%`);
    }
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  // Soft delete: marks user as deleted and deactivates account.
  // Financial records and audit logs remain fully intact (referential integrity preserved).
  async deleteUser(client, id) {
    const query = `
      UPDATE users
      SET deleted_at = NOW(), status = 'inactive'
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [id]);
    return result.rows[0];
  }

  async incrementTokenVersion(client, id) {
    const query = `
      UPDATE users
      SET token_version = token_version + 1
      WHERE id = $1
      RETURNING id, token_version
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [id]);
    return result.rows[0];
  }
  
  async updateLastLogin(client, id) {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
      RETURNING id, last_login
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [id]);
    return result.rows[0];
  }
  
  async updateStatus(client, id, status) {
    const query = `
      UPDATE users
      SET status = $1
      WHERE id = $2
      RETURNING id, status
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = new UsersRepository();