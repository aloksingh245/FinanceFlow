const express = require('express');
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authenticate);
router.use(authorize('manage_users'));

router.get('/logs', asyncWrapper(auditController.getLogs));

module.exports = router;