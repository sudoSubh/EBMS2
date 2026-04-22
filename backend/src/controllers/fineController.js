const Fine = require('../models/Fine');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendNotificationWithEmail } = require('../services/notificationService');
const { getSettings } = require('../services/settingsService');

/**
 * GET /api/fines
 */
const getFines = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (userId) query.user = userId;
  if (req.user.role === 'student') query.user = req.user._id;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [fines, total] = await Promise.all([
    Fine.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email studentId')
      .populate('book', 'title author')
      .populate('transaction', 'issueDate dueDate returnDate'),
    Fine.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, fines, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * POST /api/fines/:id/pay
 */
const payFine = asyncHandler(async (req, res) => {
  const { amount, method = 'cash', reference } = req.body;

  const fine = await Fine.findById(req.params.id)
    .populate('user', 'name email')
    .populate('book', 'title');

  if (!fine) return ApiResponse.notFound(res, 'Fine not found');
  if (fine.status === 'paid') return ApiResponse.badRequest(res, 'Fine already paid');

  const remaining = fine.totalAmount - fine.paidAmount;
  const payAmount = Math.min(parseFloat(amount), remaining);

  fine.paidAmount += payAmount;
  fine.paymentMethod = method;
  fine.paymentReference = reference;
  fine.collectedBy = req.user._id;

  if (fine.paidAmount >= fine.totalAmount) {
    fine.status = 'paid';
    fine.paidAt = new Date();
  } else {
    fine.status = 'partial';
  }
  await fine.save();

  // Check if user should be unblocked
  const settings = await getSettings();
  const totalPendingFines = await Fine.aggregate([
    { $match: { user: fine.user._id, status: { $in: ['pending', 'partial'] } } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } },
  ]);
  const pendingTotal = totalPendingFines[0]?.total || 0;

  if (pendingTotal < settings.fines.blockOnFineAmount) {
    const user = await User.findById(fine.user._id);
    if (user?.isBlocked && user.blockedReason?.includes('fines')) {
      await User.findByIdAndUpdate(fine.user._id, { isBlocked: false, blockedReason: '' });
    }
  }

  await sendNotificationWithEmail({
    userId: fine.user._id,
    userEmail: fine.user.email,
    userName: fine.user.name,
    type: 'fine_paid',
    title: 'Fine Payment Recorded',
    message: `Payment of ₹${payAmount} recorded for fine on "${fine.book?.title || 'book'}". ${fine.status === 'paid' ? 'Fine fully cleared!' : `Remaining: ₹${fine.totalAmount - fine.paidAmount}`}`,
    metadata: { fineId: fine._id, amount: payAmount },
  });

  return ApiResponse.success(res, fine, `Payment of ₹${payAmount} recorded successfully`);
});

/**
 * POST /api/fines/:id/waive
 */
const waiveFine = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const fine = await Fine.findById(req.params.id).populate('user', 'name email');
  if (!fine) return ApiResponse.notFound(res, 'Fine not found');

  fine.status = 'waived';
  fine.waivedAt = new Date();
  fine.waivedBy = req.user._id;
  fine.waivedReason = reason;
  await fine.save();

  return ApiResponse.success(res, fine, 'Fine waived successfully');
});

/**
 * GET /api/fines/stats
 */
const getFineStats = asyncHandler(async (req, res) => {
  const stats = await Fine.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
      },
    },
  ]);

  const revenue = await Fine.aggregate([
    { $match: { status: { $in: ['paid', 'partial'] } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } },
  ]);

  return ApiResponse.success(res, { stats, totalRevenue: revenue[0]?.total || 0 });
});

module.exports = { getFines, payFine, waiveFine, getFineStats };
