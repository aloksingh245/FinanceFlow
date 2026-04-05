const express = require('express');
const rolesController = require('../controllers/roles.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateRoleSchema } = require('../validators/role.validator');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authenticate);
router.use(authorize('manage_users'));

router.get('/', asyncWrapper(rolesController.getRoles));
router.patch('/:id', validate(updateRoleSchema), asyncWrapper(rolesController.updateRole));

module.exports = router;