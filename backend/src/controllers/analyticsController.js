const IssueTransaction = require('../models/IssueTransaction');
const Fine = require('../models/Fine');
const User = require('../models/User');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/analytics/dashboard */
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, activeUsers, totalBooks, issuedBooks, overdueBooks, fineRevenue, recentIssues, newUsersThisMonth] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true, lastLogin: { $gte: thirtyDaysAgo } }),
    Book.countDocuments({ isActive: true }),
    IssueTransaction.countDocuments({ status: { $in: ['active', 'overdue'] } }),
    IssueTransaction.countDocuments({ status: 'overdue' }),
    Fine.aggregate([{ $match: { status: { $in: ['paid', 'partial'] } } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
    IssueTransaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
  ]);
  return ApiResponse.success(res, { totalUsers, activeUsers, totalBooks, issuedBooks, overdueBooks, fineRevenue: fineRevenue[0]?.total || 0, recentIssues, newUsersThisMonth });
});

/** GET /api/analytics/issue-trends */
const getIssueTrends = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  const trends = await IssueTransaction.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, issued: { $sum: 1 }, returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } } } },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    { $project: { _id: 0, date: { $dateToString: { format: '%Y-%m-%d', date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } } } }, issued: 1, returned: 1 } },
  ]);
  return ApiResponse.success(res, trends);
});

/** GET /api/analytics/revenue-trends */
const getRevenueTrends = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));
  const trends = await Fine.aggregate([
    { $match: { paidAt: { $gte: startDate }, status: { $in: ['paid', 'partial'] } } },
    { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: { _id: 0, month: { $dateToString: { format: '%Y-%m', date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 } } } }, revenue: 1, count: 1 } },
  ]);
  return ApiResponse.success(res, trends);
});

/** GET /api/analytics/category-distribution */
const getCategoryDistribution = asyncHandler(async (req, res) => {
  const data = await Book.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
  ]);
  return ApiResponse.success(res, data);
});

/** GET /api/analytics/popular-books */
const getPopularBooks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await IssueTransaction.aggregate([
    { $group: { _id: '$book', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: parseInt(limit) },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $project: { title: '$book.title', author: '$book.author', category: '$book.category', coverImage: '$book.coverImage', count: 1 } },
  ]);
  return ApiResponse.success(res, data);
});

// ─────────────────── REPORTS ───────────────────

/** GET /api/analytics/reports/overdue — Overdue books list with fine details */
const getOverdueReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const overdueList = await IssueTransaction.find({ status: { $in: ['active', 'overdue'] }, dueDate: { $lt: now } })
    .populate('user', 'name email phone studentId employeeId department')
    .populate('book', 'title author isbn category')
    .populate('bookCopy', 'copyNumber barcode')
    .populate('fine', 'totalAmount paidAmount status')
    .sort('dueDate').lean();

  const enriched = overdueList.map(t => ({
    ...t,
    daysOverdue: Math.floor((now - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)),
  }));

  return ApiResponse.success(res, {
    summary: {
      totalOverdue: enriched.length,
      avgDaysOverdue: enriched.length ? Math.round(enriched.reduce((s, t) => s + t.daysOverdue, 0) / enriched.length) : 0,
      totalFinesDue: enriched.reduce((s, t) => s + ((t.fine?.totalAmount || 0) - (t.fine?.paidAmount || 0)), 0),
    },
    list: enriched,
  });
});

/** GET /api/analytics/reports/stock — Inventory: by status, condition, lost/damaged, out-of-stock */
const getStockReport = asyncHandler(async (req, res) => {
  const [totalCopies, byStatus, byCondition, byCategory, lostDamaged, outOfStock] = await Promise.all([
    BookCopy.countDocuments({ isActive: true }),
    BookCopy.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $project: { _id: 0, status: '$_id', count: 1 } }]),
    BookCopy.aggregate([{ $group: { _id: '$condition', count: { $sum: 1 } } }, { $project: { _id: 0, condition: '$_id', count: 1 } }]),
    Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', totalCopies: { $sum: '$totalCopies' }, availableCopies: { $sum: '$availableCopies' } } },
      { $sort: { totalCopies: -1 } },
      { $project: { _id: 0, category: '$_id', totalCopies: 1, availableCopies: 1 } },
    ]),
    BookCopy.find({ status: { $in: ['lost', 'damaged'] }, isActive: true })
      .populate('book', 'title author isbn').select('copyNumber status condition notes book').lean(),
    Book.find({ isActive: true, availableCopies: 0, totalCopies: { $gt: 0 } })
      .select('title author isbn category totalCopies availableCopies').limit(20).lean(),
  ]);
  return ApiResponse.success(res, { summary: { totalCopies }, byStatus, byCondition, byCategory, lostOrDamaged: lostDamaged, outOfStock });
});

/** GET /api/analytics/reports/purchases — Purchase orders, invoices, spend by supplier */
const getPurchaseReport = asyncHandler(async (req, res) => {
  const { months = 12 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const [recentPOs, recentInvoices, spendBySupplier, statusBreakdown] = await Promise.all([
    PurchaseOrder.find({ createdAt: { $gte: startDate } }).populate('supplier', 'name code').select('poNumber status totalAmount orderDate supplier').sort('-orderDate').limit(50).lean(),
    Invoice.find({ createdAt: { $gte: startDate } }).populate('supplier', 'name code').select('invoiceNumber status totalAmount invoiceDate supplier').sort('-invoiceDate').limit(50).lean(),
    Invoice.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$supplier', totalSpend: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 's' } },
      { $unwind: { path: '$s', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: '$s.name', code: '$s.code', totalSpend: 1, count: 1 } },
      { $sort: { totalSpend: -1 } },
    ]),
    PurchaseOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      { $project: { _id: 0, status: '$_id', count: 1, total: 1 } },
    ]),
  ]);

  return ApiResponse.success(res, {
    summary: { totalSpend: recentInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0), invoiceCount: recentInvoices.length, poCount: recentPOs.length },
    spendBySupplier, statusBreakdown, recentPOs, recentInvoices,
  });
});

/** GET /api/analytics/reports/members — Role breakdown, top borrowers, blocked, inactive */
const getMemberReport = asyncHandler(async (req, res) => {
  const [roleBreakdown, topBorrowers, blockedUsers, inactiveUsers] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      { $project: { _id: 0, role: '$_id', count: 1, active: 1 } },
    ]),
    IssueTransaction.aggregate([
      { $group: { _id: '$user', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } }, { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $project: { _id: 0, name: '$u.name', email: '$u.email', role: '$u.role', studentId: '$u.studentId', borrowCount: 1 } },
    ]),
    User.find({ isBlocked: true }).select('name email role blockedReason studentId').lean(),
    User.find({ isActive: true, lastLogin: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }).select('name email role lastLogin').limit(20).lean(),
  ]);
  return ApiResponse.success(res, { roleBreakdown, topBorrowers, blockedUsers, inactiveUsers });
});

module.exports = {
  getDashboardStats, getIssueTrends, getRevenueTrends, getCategoryDistribution, getPopularBooks,
  getOverdueReport, getStockReport, getPurchaseReport, getMemberReport,
};
