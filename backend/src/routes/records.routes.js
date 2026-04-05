const express = require('express');
const recordsController = require('../controllers/records.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createRecordSchema, updateRecordSchema } = require('../validators/record.validator');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('read'), asyncWrapper(recordsController.getRecords));
router.get('/:id', authorize('read'), asyncWrapper(recordsController.getRecordById));
router.post('/', authorize('write'), validate(createRecordSchema), asyncWrapper(recordsController.createRecord));
router.patch('/:id', authorize('write'), validate(updateRecordSchema), asyncWrapper(recordsController.updateRecord));
router.delete('/:id', authorize('write'), asyncWrapper(recordsController.deleteRecord));
router.post('/:id/restore', authorize('restore_records'), asyncWrapper(recordsController.restoreRecord));

module.exports = router;