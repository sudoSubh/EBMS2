const supabase = require('../config/supabase');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Verify Supabase JWT token and attach user to req
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'No authentication token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token');
    }

    // Get user from our DB
    let dbUser = await User.findOne({ supabaseId: supabaseUser.id });

    if (!dbUser) {
      // Try to find by email (first login sync)
      dbUser = await User.findOne({ email: supabaseUser.email });
      if (dbUser && !dbUser.supabaseId) {
        dbUser.supabaseId = supabaseUser.id;
        await dbUser.save();
      }
    }

    if (!dbUser) {
      return ApiResponse.unauthorized(res, 'User not found in system. Contact administrator.');
    }

    if (!dbUser.isActive) {
      return ApiResponse.forbidden(res, 'Your account has been deactivated');
    }

    if (dbUser.isBlocked) {
      return ApiResponse.forbidden(res, `Account blocked: ${dbUser.blockedReason || 'Contact library staff'}`);
    }

    req.user = dbUser;
    req.supabaseUser = supabaseUser;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    return ApiResponse.unauthorized(res, 'Authentication failed');
  }
});

/**
 * Role-based authorization middleware factory
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Please login first');
    }
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `Access denied. Required roles: ${roles.join(', ')}`);
    }
    next();
  };
};

const isAdmin = authorize('admin');
const isAdminOrLibrarian = authorize('admin', 'librarian');
const isStaff = authorize('admin', 'librarian', 'staff');
const isStudent = authorize('student');

module.exports = { authenticate, authorize, isAdmin, isAdminOrLibrarian, isStaff };
