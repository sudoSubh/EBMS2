const supabase = require('../config/supabase');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Create Supabase user + DB user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name, role = 'student', phone, department } = req.body;

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (authError) {
    return ApiResponse.badRequest(res, authError.message);
  }

  // Create DB user
  const user = await User.create({
    supabaseId: authData.user.id,
    email,
    name,
    role,
    phone,
    department,
  });

  logger.info(`New user registered: ${email} (${role})`);
  return ApiResponse.created(res, {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }, 'User registered successfully');
});

/**
 * POST /api/auth/login
 * Sign in and return token + user profile
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return ApiResponse.unauthorized(res, 'Invalid email or password');
  }

  const user = await User.findOne({ supabaseId: authData.user.id }).select('-__v');

  if (!user) {
    return ApiResponse.unauthorized(res, 'User account not found');
  }

  if (!user.isActive) {
    return ApiResponse.forbidden(res, 'Your account has been deactivated');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return ApiResponse.success(res, {
    token: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isBlocked: user.isBlocked,
    },
  }, 'Login successful');
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return ApiResponse.badRequest(res, 'Refresh token required');

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) return ApiResponse.unauthorized(res, 'Invalid refresh token');

  return ApiResponse.success(res, {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    await supabase.auth.admin.signOut(token).catch(() => {});
  }
  return ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-__v')
    .populate('borrowingHistory', 'status dueDate book', null, { limit: 5 });
  return ApiResponse.success(res, user);
});

/**
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { error } = await supabase.auth.admin.updateUserById(req.supabaseUser.id, { password });
  if (error) return ApiResponse.badRequest(res, error.message);
  return ApiResponse.success(res, null, 'Password changed successfully');
});

module.exports = { register, login, refresh, logout, getMe, changePassword };
