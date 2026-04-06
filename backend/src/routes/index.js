const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const recordsRoutes = require('./records.routes');
const rolesRoutes = require('./roles.routes');
const analyticsRoutes = require('./analytics.routes');
const auditRoutes = require('./audit.routes');
const { pool } = require('../config/db');

const v1Router = express.Router();

v1Router.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT NOW()');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }
  
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString()
    }
  });
});

v1Router.use('/auth', authRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/records', recordsRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/roles', rolesRoutes);
v1Router.use('/audit', auditRoutes);

module.exports = v1Router;