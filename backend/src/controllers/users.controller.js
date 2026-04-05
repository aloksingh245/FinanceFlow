const usersService = require('../services/users.service');
const { success } = require('../utils/apiResponse');
const { hasPermission } = require('../policies/rbac.policy');
const { getPaginationParams } = require('../utils/pagination');

class UsersController {
  async getAllUsers(req, res) {
    const { page, limit } = getPaginationParams(req.query);
    const search = req.query.search || '';
    const users = await usersService.getAllUsers(page, limit, search);
    success(res, 200, users, 'Users retrieved');
  }

  async getUserById(req, res) {
    const hasManageUsers = hasPermission(req.user.role, 'manage_users');
    const user = await usersService.getUserById(req.params.id, req.user.id, hasManageUsers);
    success(res, 200, user, 'User retrieved');
  }

  async getProfile(req, res) {
    const user = await usersService.getUserProfile(req.user.id);
    success(res, 200, user, 'Profile retrieved');
  }

  async updateStatus(req, res) {
    const { status } = req.body;
    const user = await usersService.updateStatus(req.user.id, req.params.id, status, req.ip, req.requestId);
    success(res, 200, user, 'User status updated');
  }

  async deleteUser(req, res) {
    await usersService.deleteUser(req.user.id, req.params.id, req.ip, req.requestId);
    success(res, 200, null, 'User deleted successfully');
  }
}

module.exports = new UsersController();