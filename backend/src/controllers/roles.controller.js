const rolesService = require('../services/roles.service');
const { success } = require('../utils/apiResponse');

class RolesController {
  async getRoles(req, res) {
    const roles = await rolesService.getRoles();
    success(res, 200, roles, 'Roles retrieved');
  }

  async updateRole(req, res) {
    const { permissions_json } = req.body;
    const role = await rolesService.updateRole(req.user.id, req.params.id, permissions_json, req.ip, req.requestId);
    success(res, 200, role, 'Role updated successfully');
  }
}

module.exports = new RolesController();