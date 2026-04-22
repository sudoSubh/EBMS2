const User = require('../models/User');
const IssueTransaction = require('../models/IssueTransaction');
const Fine = require('../models/Fine');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/users - List users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive, isBlocked } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)).select('-__v'),
    User.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, users, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) return ApiResponse.notFound(res, 'User not found');

  // Allow students to only view their own profile
  if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
    return ApiResponse.forbidden(res);
  }

  const [activeTransactions, pendingFines] = await Promise.all([
    IssueTransaction.countDocuments({ user: user._id, status: { $in: ['active', 'overdue'] } }),
    Fine.aggregate([
      { $match: { user: user._id, status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } },
    ]),
  ]);

  return ApiResponse.success(res, {
    user,
    stats: {
      activeTransactions,
      pendingFineAmount: pendingFines[0]?.total || 0,
    },
  });
});

/**
 * POST /api/users - Create user
 */
const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  return ApiResponse.created(res, user, 'User created successfully');
});

/**
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { isBlocked, blockedReason, role, isActive, ...rest } = req.body;

  // Only admins can change roles or block
  const updateData = { ...rest };
  if (req.user.role === 'admin') {
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked;
      updateData.blockedReason = isBlocked ? blockedReason : '';
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!user) return ApiResponse.notFound(res, 'User not found');
  return ApiResponse.success(res, user, 'User updated successfully');
});

/**
 * DELETE /api/users/:id - Soft delete (deactivate)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  const activeIssues = await IssueTransaction.countDocuments({
    user: user._id,
    status: { $in: ['active', 'overdue'] },
  });
  if (activeIssues > 0) {
    return ApiResponse.badRequest(res, 'Cannot deactivate user with active issues');
  }

  user.isActive = false;
  await user.save();
  return ApiResponse.success(res, null, 'User deactivated successfully');
});

/**
 * GET /api/users/:id/history - Borrowing history
 */
const getUserHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.params.id;

  if (req.user.role === 'student' && userId !== req.user._id.toString()) {
    return ApiResponse.forbidden(res);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [transactions, total] = await Promise.all([
    IssueTransaction.find({ user: userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('book', 'title author coverImage isbn')
      .populate('fine', 'totalAmount status'),
    IssueTransaction.countDocuments({ user: userId }),
  ]);

  return ApiResponse.paginated(res, transactions, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, blockedUsers, roleStats] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isBlocked: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  return ApiResponse.success(res, { totalUsers, activeUsers, blockedUsers, roleStats });
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, getUserHistory, getUserStats };
