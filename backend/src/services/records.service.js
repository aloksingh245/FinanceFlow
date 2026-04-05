const recordsRepository = require('../repositories/records.repository');
const auditService = require('../audit/audit.service');
const AUDIT_ACTIONS = require('../audit/audit.actions');
const { withTransaction } = require('../config/db');
const logger = require('../utils/logger');

class RecordsService {
  async getRecords(userId, filters) {
    try {
      const data = await recordsRepository.findRecordsByUser(userId, filters);
      const total = await recordsRepository.countByUser(userId, filters);
      const { page, limit } = filters;
      
      return {
        data,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          hasMore: (page * limit) < total
        }
      };
    } catch (error) {
      logger.error('Error fetching records', { userId, error: error.message });
      throw error;
    }
  }

  async getRecordById(userId, recordId, userRole) {
    try {
      const record = await recordsRepository.findByIdIncludingDeleted(recordId);
      if (!record) {
        throw { statusCode: 404, message: 'Record not found' };
      }

      if (record.user_id !== userId && userRole !== 'admin') {
        logger.warn('Unauthorized cross-user access attempt', { userId, recordId });
        throw { statusCode: 403, message: 'Forbidden: Insufficient permissions' };
      }

      if (record.deleted_at) {
        throw { statusCode: 404, message: 'Record not found' };
      }

      return record;
    } catch (error) {
      logger.error('Error fetching record', { userId, recordId, error: error.message });
      throw error;
    }
  }

  async createRecord(userId, amount, type, category, notes, date, idempotencyKey, ipAddress, reqId) {
    try {
      if (idempotencyKey) {
        const existing = await recordsRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          throw { statusCode: 409, message: 'Duplicate request detected' };
        }
      }

      return await withTransaction(reqId, async (client) => {
        try {
          const record = await recordsRepository.createRecord(client, userId, amount, type, category, notes, date, idempotencyKey);
          await auditService.logAction(client, userId, AUDIT_ACTIONS.CREATE_RECORD, 'financial_records', record.id, ipAddress, reqId);
          logger.info(`Record created successfully`, { userId, recordId: record.id, requestId: reqId });
          return record;
        } catch (error) {
          if (error.code === '23505') {
            throw { statusCode: 409, message: 'Duplicate request detected' };
          }
          throw error;
        }
      });
    } catch (error) {
      if (error.statusCode !== 409) {
        logger.error('Error creating record', { userId, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }

  async updateRecord(userId, recordId, userRole, data, ipAddress, reqId) {
    try {
      return await withTransaction(reqId, async (client) => {
        const currentRecord = await recordsRepository.findByIdIncludingDeleted(recordId);
        if (!currentRecord) {
          throw { statusCode: 404, message: 'Record not found' };
        }

        if (currentRecord.user_id !== userId && userRole !== 'admin') {
          throw { statusCode: 403, message: 'Forbidden: Insufficient permissions' };
        }

        if (currentRecord.deleted_at) {
          throw { statusCode: 404, message: 'Record not found' };
        }

        const record = await recordsRepository.updateRecord(client, recordId, currentRecord.user_id, data);
        if (!record) {
          logger.warn('Update record failed: Concurrency conflict', { userId, recordId, requestId: reqId });
          throw { statusCode: 409, message: 'Record was modified by another request' };
        }
        
        await auditService.logAction(client, userId, AUDIT_ACTIONS.UPDATE_RECORD, 'financial_records', record.id, ipAddress, reqId);
        logger.info(`Record updated successfully`, { userId, recordId, requestId: reqId });
        return record;
      });
    } catch (error) {
      if (error.statusCode !== 409 && error.statusCode !== 403 && error.statusCode !== 404) {
        logger.error('Error updating record', { userId, recordId, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }

  async deleteRecord(userId, recordId, userRole, ipAddress, reqId) {
    try {
      return await withTransaction(reqId, async (client) => {
        const record = await recordsRepository.findByIdIncludingDeleted(recordId);
        if (!record || record.deleted_at) {
          throw { statusCode: 404, message: 'Record not found' };
        }

        if (record.user_id !== userId && userRole !== 'admin') {
          throw { statusCode: 403, message: 'Forbidden: Insufficient permissions' };
        }

        const deleted = await recordsRepository.softDeleteRecord(client, recordId, record.user_id);
        await auditService.logAction(client, userId, AUDIT_ACTIONS.DELETE_RECORD, 'financial_records', recordId, ipAddress, reqId);
        logger.info(`Record deleted successfully`, { userId, recordId, requestId: reqId });
        return deleted;
      });
    } catch (error) {
      if (error.statusCode !== 403 && error.statusCode !== 404) {
        logger.error('Error deleting record', { userId, recordId, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }

  async restoreRecord(userId, recordId, ipAddress, reqId) {
    try {
      return await withTransaction(reqId, async (client) => {
        const record = await recordsRepository.findByIdIncludingDeleted(recordId);
        if (!record) {
          throw { statusCode: 404, message: 'Record not found' };
        }

        if (!record.deleted_at) {
          throw { statusCode: 400, message: 'Record is not deleted' };
        }

        const restored = await recordsRepository.restoreRecord(client, recordId);
        await auditService.logAction(client, userId, AUDIT_ACTIONS.RESTORE_RECORD, 'financial_records', recordId, ipAddress, reqId);
        logger.info(`Record restored successfully`, { userId, recordId, requestId: reqId });
        return restored;
      });
    } catch (error) {
      if (error.statusCode !== 400 && error.statusCode !== 404) {
        logger.error('Error restoring record', { userId, recordId, error: error.message, requestId: reqId });
      }
      throw error;
    }
  }
}

module.exports = new RecordsService();