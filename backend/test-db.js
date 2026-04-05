const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
pool.connect((err, client, done) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to PostgreSQL server.');
  client.query('CREATE DATABASE finance_db', (err) => {
    if (err) {
      if (err.code === '42P04') {
        console.log('Database finance_db already exists.');
      } else {
        console.error('Failed to create database:', err.message);
      }
    } else {
      console.log('Database finance_db created.');
    }
    pool.end();
  });
});