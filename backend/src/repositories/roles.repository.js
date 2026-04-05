const { pool } = require('../config/db');

class RolesRepository {
  async findByName(name) {
    const query = `SELECT id, role_name as name, permissions_json FROM roles WHERE role_name = $1`;
    const result = await pool.query(query, [name]);
    return result.rows[0];
  }

  async getRoles() {
    const query = `SELECT id, role_name as name, permissions_json FROM roles`;
    const result = await pool.query(query);
    return result.rows;
  }

  async updateRole(client, id, permissions) {
    const query = `
      UPDATE roles
      SET permissions_json = $1
      WHERE id = $2
      RETURNING id, role_name as name, permissions_json
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [JSON.stringify(permissions), id]);
    return result.rows[0];
  }
}

module.exports = new RolesRepository();