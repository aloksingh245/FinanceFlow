const { pool } = require('../config/db');

class RecordsRepository {
  async createRecord(client, userId, amount, type, category, notes, date, idempotencyKey) {
    const query = `
      INSERT INTO financial_records (user_id, amount, type, category, notes, date, idempotency_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, amount, type, category, notes, date, created_at, updated_at, idempotency_key
    `;
    const dbClient = client || pool;
    const params = [
      userId,
      amount,
      type,
      category,
      notes !== undefined ? notes : null,
      date,
      idempotencyKey !== undefined ? idempotencyKey : null
    ];
    const result = await dbClient.query(query, params);
    return result.rows[0];
  }

  async updateRecord(client, id, userId, data) {
    const { amount, type, category, notes, date, updated_at } = data;
    const query = `
      UPDATE financial_records 
      SET amount = COALESCE($1, amount),
          type = COALESCE($2, type),
          category = COALESCE($3, category),
          notes = COALESCE($4, notes),
          date = COALESCE($5, date),
          updated_at = NOW()
      WHERE id = $6 AND user_id = $7 AND DATE_TRUNC('milliseconds', updated_at) = DATE_TRUNC('milliseconds', $8::timestamptz) AND deleted_at IS NULL
      RETURNING id, user_id, amount, type, category, notes, date, created_at, updated_at
    `;
    const dbClient = client || pool;
    const params = [
      amount !== undefined ? amount : null,
      type !== undefined ? type : null,
      category !== undefined ? category : null,
      notes !== undefined ? notes : null,
      date !== undefined ? date : null,
      id,
      userId,
      updated_at
    ];
    const result = await dbClient.query(query, params);
    return result.rows[0];
  }

  async softDeleteRecord(client, id, userId) {
    const query = `
      UPDATE financial_records 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL 
      RETURNING id, updated_at, deleted_at
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [id, userId]);
    return result.rows[0];
  }

  async restoreRecord(client, id) {
    const query = `
      UPDATE financial_records 
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NOT NULL 
      RETURNING id, updated_at, deleted_at
    `;
    const dbClient = client || pool;
    const result = await dbClient.query(query, [id]);
    return result.rows[0];
  }

  async findById(id, userId) {
    const query = `
      SELECT id, user_id, amount, type, category, notes, date, created_at, updated_at, idempotency_key
      FROM financial_records 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async findByIdIncludingDeleted(id) {
    const query = `
      SELECT id, user_id, amount, type, category, notes, date, created_at, updated_at, deleted_at, idempotency_key 
      FROM financial_records 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findByIdempotencyKey(key) {
    const query = `SELECT id FROM financial_records WHERE idempotency_key = $1`;
    const result = await pool.query(query, [key]);
    return result.rows[0];
  }

  async countByUser(userId, filters = {}) {
    const { from, to, type, search, seeAll } = filters;
    let query = `SELECT COUNT(id) FROM financial_records WHERE deleted_at IS NULL AND (user_id = $1 OR $2 = true)`;
    const params = [userId, seeAll || false];
    let paramIndex = 3;

    if (from)   { query += ` AND date >= $${paramIndex++}`;               params.push(from); }
    if (to)     { query += ` AND date <= $${paramIndex++}`;               params.push(to); }
    if (type)   { query += ` AND type = $${paramIndex++}`;                params.push(type); }
    if (search) { query += ` AND category ILIKE $${paramIndex++}`;        params.push(`%${search}%`); }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  async findRecordsByUser(userId, filters = {}) {
    const { from, to, type, search, seeAll, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT fr.id, fr.user_id, fr.amount, fr.type, fr.category, fr.notes, fr.date,
             fr.created_at, fr.updated_at, u.name AS user_name
      FROM financial_records fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.deleted_at IS NULL AND (fr.user_id = $1 OR $2 = true)
    `;
    const params = [userId, seeAll || false];
    let paramIndex = 3;

    if (from)   { query += ` AND fr.date >= $${paramIndex++}`;            params.push(from); }
    if (to)     { query += ` AND fr.date <= $${paramIndex++}`;            params.push(to); }
    if (type)   { query += ` AND fr.type = $${paramIndex++}`;             params.push(type); }
    if (search) { query += ` AND fr.category ILIKE $${paramIndex++}`;     params.push(`%${search}%`); }

    query += ` ORDER BY fr.date DESC, fr.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new RecordsRepository();