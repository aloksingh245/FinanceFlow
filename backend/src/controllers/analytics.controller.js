const aggregationService = require('../analytics/aggregation.service');
const { success } = require('../utils/apiResponse');

const getFilters = (req) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const from = req.query.from || defaultFrom;
  const to = req.query.to || defaultTo;
  
  return {
    from,
    to,
    userId: req.user.id,
    seeAll: true // all authenticated users see aggregated data; breakdown stays admin-only
  };
};

class AnalyticsController {
  async getSummary(req, res) {
    const params = getFilters(req);
    const data = await aggregationService.getSummary(params);
    success(res, 200, data, 'Summary analytics retrieved');
  }

  async getCategory(req, res) {
    const params = getFilters(req);
    const data = await aggregationService.getCategorySummary(params);
    success(res, 200, data, 'Category analytics retrieved');
  }

  async getMonthly(req, res) {
    const params = getFilters(req);
    const data = await aggregationService.getMonthlyTrends(params);
    success(res, 200, data, 'Monthly analytics retrieved');
  }

  async getRecent(req, res) {
    const params = {
      userId: req.user.id,
      seeAll: true // all authenticated users see aggregated data; breakdown stays admin-only
    };
    const data = await aggregationService.getRecentTransactions(params);
    success(res, 200, data, 'Recent analytics retrieved');
  }

  async getUserBreakdown(req, res) {
    const { from, to } = getFilters(req);
    const data = await aggregationService.getUserBreakdown({ from, to });
    success(res, 200, data, 'User breakdown retrieved');
  }
}

module.exports = new AnalyticsController();