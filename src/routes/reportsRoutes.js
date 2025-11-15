const express = require('express');
const router = express.Router();
const {
  getFinancialOverview,
  getRevenueTrend,
  getPaymentMethods,
  getPopularServices,
  getDailyPerformance
} = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.get('/financial-overview', authenticate, getFinancialOverview);
router.get('/revenue-trend', authenticate, getRevenueTrend);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.get('/popular-services', authenticate, getPopularServices);
router.get('/daily-performance', authenticate, getDailyPerformance);

module.exports = router;

