const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const ROLLBACK_DIR = path.join(MIGRATIONS_DIR, 'rollback');

async function runFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  logger.info(`Executing: ${path.basename(filePath)}`);
  await pool.query(sql);
}

async function migrate() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      await runFile(path.join(MIGRATIONS_DIR, file));
    }
    logger.info('Migration completed successfully.');
  } catch (err) {
    logger.error('Migration failed', { error: err.message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function rollback() {
  try {
    const files = fs.readdirSync(ROLLBACK_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();
    
    for (const file of files) {
      await runFile(path.join(ROLLBACK_DIR, file));
    }
    logger.info('Rollback completed successfully.');
  } catch (err) {
    logger.error('Rollback failed', { error: err.message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const command = process.argv[2];
if (command === 'migrate') migrate();
else if (command === 'rollback') rollback();
else {
  logger.info('Usage: node runner.js [migrate|rollback]');
  process.exit(1);
}