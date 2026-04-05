const express = require('express');
const usersController = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../validators/user.validator');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('manage_users'), asyncWrapper(usersController.getAllUsers));
router.get('/profile', asyncWrapper(usersController.getProfile));
router.get('/:id', authorize('manage_users'), asyncWrapper(usersController.getUserById));
router.patch('/:id/status', authorize('manage_users'), validate(updateUserSchema), asyncWrapper(usersController.updateStatus));
router.delete('/:id', authorize('manage_users'), asyncWrapper(usersController.deleteUser));

module.exports = router;