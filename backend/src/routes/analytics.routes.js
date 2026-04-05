const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { querySchema } = require('../validators/analytics.validator');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authenticate);
router.use(authorize('analytics'));

router.get('/summary',        validate(querySchema, 'query'), asyncWrapper(analyticsController.getSummary));
router.get('/category',       validate(querySchema, 'query'), asyncWrapper(analyticsController.getCategory));
router.get('/monthly',        validate(querySchema, 'query'), asyncWrapper(analyticsController.getMonthly));
router.get('/recent',         asyncWrapper(analyticsController.getRecent));
router.get('/users/breakdown', authorize('manage_users'), validate(querySchema, 'query'), asyncWrapper(analyticsController.getUserBreakdown));

module.exports = router;