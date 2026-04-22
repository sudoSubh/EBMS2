const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getIssueTrends, getRevenueTrends,
  getCategoryDistribution, getPopularBooks,
  getOverdueReport, getStockReport, getPurchaseReport, getMemberReport,
} = require('../controllers/analyticsController');
const { authenticate, isStaff } = require('../middleware/auth');

router.get('/dashboard', authenticate, isStaff, getDashboardStats);
router.get('/issue-trends', authenticate, isStaff, getIssueTrends);
router.get('/revenue-trends', authenticate, isStaff, getRevenueTrends);
router.get('/category-distribution', authenticate, isStaff, getCategoryDistribution);
router.get('/popular-books', authenticate, isStaff, getPopularBooks);

// Report endpoints
router.get('/reports/overdue', authenticate, isStaff, getOverdueReport);
router.get('/reports/stock', authenticate, isStaff, getStockReport);
router.get('/reports/purchases', authenticate, isStaff, getPurchaseReport);
router.get('/reports/members', authenticate, isStaff, getMemberReport);

module.exports = router;
