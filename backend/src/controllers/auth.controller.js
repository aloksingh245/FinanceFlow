const authService = require('../services/auth.service');
const { success } = require('../utils/apiResponse');

class AuthController {
  async register(req, res) {
    const { name, email, password, role } = req.body;
    const user = await authService.register(name, email, password, role, req.ip, req.requestId);
    success(res, 201, user, 'User registered successfully');
  }

  async login(req, res) {
    const { email, password } = req.body;
    const token = await authService.login(email, password, req.ip, req.requestId);
    success(res, 200, { token }, 'Login successful');
  }

  async logout(req, res) {
    await authService.logout(req.user.id, req.ip, req.requestId);
    success(res, 200, null, 'Logged out successfully');
  }
}

module.exports = new AuthController();