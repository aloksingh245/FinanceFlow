const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('connect', () => {
  logger.info('PostgreSQL connection established');
});

const withTransaction = async (requestId, callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  withTransaction,
};