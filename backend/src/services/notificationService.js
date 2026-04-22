const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const createNotification = async ({ userId, type, title, message, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      metadata,
    });
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
  }
};

const sendNotificationWithEmail = async ({
  userId,
  userEmail,
  userName,
  type,
  title,
  message,
  emailTemplate,
  emailArgs = [],
  metadata = {},
}) => {
  // Create DB notification
  const notification = await createNotification({ userId, type, title, message, metadata });

  // Send email if template provided
  if (emailTemplate && userEmail) {
    const result = await sendEmail(userEmail, emailTemplate, userName, ...emailArgs);
    if (notification && result.success) {
      notification.emailSent = true;
      notification.emailSentAt = new Date();
      await notification.save();
    }
  }

  return notification;
};

const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, limit };
};

module.exports = {
  createNotification,
  sendNotificationWithEmail,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
};
