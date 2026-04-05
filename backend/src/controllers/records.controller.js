const recordsService = require('../services/records.service');
const { success } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');

class RecordsController {
  async getRecords(req, res) {
    const { page, limit } = getPaginationParams(req.query);
    const seeAll = req.user.role === 'admin' || req.user.role === 'analyst';
    const filters = { ...req.query, page, limit, seeAll };
    const records = await recordsService.getRecords(req.user.id, filters);
    success(res, 200, records, 'Records retrieved');
  }

  async getRecordById(req, res) {
    const record = await recordsService.getRecordById(req.user.id, req.params.id, req.user.role);
    success(res, 200, record, 'Record retrieved');
  }

  async createRecord(req, res) {
    const { amount, type, category, notes, date } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotency_key || null;
    const record = await recordsService.createRecord(req.user.id, amount, type, category, notes, date, idempotencyKey, req.ip, req.requestId);
    success(res, 201, record, 'Record created successfully');
  }

  async updateRecord(req, res) {
    const recordId = req.params.id;
    const record = await recordsService.updateRecord(req.user.id, recordId, req.user.role, req.body, req.ip, req.requestId);
    success(res, 200, record, 'Record updated successfully');
  }

  async deleteRecord(req, res) {
    const recordId = req.params.id;
    await recordsService.deleteRecord(req.user.id, recordId, req.user.role, req.ip, req.requestId);
    success(res, 200, null, 'Record deleted successfully');
  }

  async restoreRecord(req, res) {
    const recordId = req.params.id;
    await recordsService.restoreRecord(req.user.id, recordId, req.ip, req.requestId);
    success(res, 200, null, 'Record restored successfully');
  }
}

module.exports = new RecordsController();