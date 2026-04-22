const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { markAsRead, markAllAsRead, getUserNotifications } = require('../services/notificationService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await getUserNotifications(req.user._id, parseInt(page), parseInt(limit));
  return ApiResponse.paginated(res, data.notifications, {
    page: data.page, limit: data.limit, total: data.total,
    pages: Math.ceil(data.total / data.limit), unreadCount: data.unreadCount,
  });
}));

router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id, req.user._id);
  return ApiResponse.success(res, notification);
}));

router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
  await markAllAsRead(req.user._id);
  return ApiResponse.success(res, null, 'All notifications marked as read');
}));

module.exports = router;
