const { pool } = require('../config/db');

class AggregationService {
  async getSummary({ from, to, userId, seeAll }) {
    const query = `
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type='income'),  0)::numeric AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0)::numeric AS total_expense,
        (COALESCE(SUM(amount) FILTER (WHERE type='income'),  0) -
         COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0))::numeric AS net_balance
      FROM financial_records
      WHERE deleted_at IS NULL AND date BETWEEN $1 AND $2
        AND (user_id = $3 OR $4 = true)
    `;
    const result = await pool.query(query, [from, to, userId, seeAll]);
    const row = result.rows[0];
    return {
      total_income:  parseFloat(row.total_income),
      total_expense: parseFloat(row.total_expense),
      net_balance:   parseFloat(row.net_balance)
    };
  }

  async getMonthlyTrends({ from, to, userId, seeAll }) {
    const query = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
        type,
        SUM(amount)::numeric AS total
      FROM financial_records
      WHERE deleted_at IS NULL AND date BETWEEN $1 AND $2
        AND (user_id = $3 OR $4 = true)
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY DATE_TRUNC('month', date) ASC
    `;
    const result = await pool.query(query, [from, to, userId, seeAll]);
    return result.rows.map(row => ({ ...row, total: parseFloat(row.total) }));
  }

  async getCategorySummary({ from, to, userId, seeAll }) {
    const query = `
      SELECT category, SUM(amount)::numeric AS total
      FROM financial_records
      WHERE type = 'expense' AND deleted_at IS NULL AND date BETWEEN $1 AND $2
        AND (user_id = $3 OR $4 = true)
      GROUP BY category
      ORDER BY total DESC
    `;
    const result = await pool.query(query, [from, to, userId, seeAll]);
    return result.rows.map(row => ({ ...row, total: parseFloat(row.total) }));
  }

  async getRecentTransactions({ userId, seeAll }) {
    const query = `
      SELECT fr.id, fr.amount::numeric, fr.type, fr.category, fr.date, fr.notes,
             u.name AS user_name
      FROM financial_records fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.deleted_at IS NULL AND (fr.user_id = $1 OR $2 = true)
      ORDER BY fr.created_at DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [userId, seeAll]);
    return result.rows.map(row => ({ ...row, amount: parseFloat(row.amount) }));
  }

  // Admin-only: per-user income/expense/balance breakdown
  async getUserBreakdown({ from, to }) {
    const query = `
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.email,
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'income'),  0)::numeric AS total_income,
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'expense'), 0)::numeric AS total_expense,
        (COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'income'),  0) -
         COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'expense'), 0))::numeric AS net_balance,
        COUNT(fr.id)::int AS record_count
      FROM users u
      LEFT JOIN financial_records fr
        ON fr.user_id = u.id AND fr.deleted_at IS NULL AND fr.date BETWEEN $1 AND $2
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY total_income DESC
    `;
    const result = await pool.query(query, [from, to]);
    return result.rows.map(row => ({
      ...row,
      total_income:  parseFloat(row.total_income),
      total_expense: parseFloat(row.total_expense),
      net_balance:   parseFloat(row.net_balance),
    }));
  }
}

module.exports = new AggregationService();
