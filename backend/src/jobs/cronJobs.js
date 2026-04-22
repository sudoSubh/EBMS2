const cron = require('node-cron');
const IssueTransaction = require('../models/IssueTransaction');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { sendNotificationWithEmail } = require('../services/notificationService');
const { getSettings } = require('../services/settingsService');
const logger = require('../utils/logger');

// ─── Every day at 8 AM: Update overdue statuses ───────────────────────────────
cron.schedule('0 8 * * *', async () => {
  try {
    const updated = await IssueTransaction.updateMany(
      { status: 'active', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );
    logger.info(`[CRON] Overdue update: ${updated.modifiedCount} transactions marked overdue`);
  } catch (err) {
    logger.error(`[CRON] Overdue update failed: ${err.message}`);
  }
});

// ─── Every day at 9 AM: Send due date reminders ───────────────────────────────
cron.schedule('0 9 * * *', async () => {
  try {
    const settings = await getSettings();
    const reminderDays = settings.notifications.dueDateReminderDays;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + reminderDays);
    const startOfDay = new Date(reminderDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reminderDate.setHours(23, 59, 59, 999));

    const dueTransactions = await IssueTransaction.find({
      status: 'active',
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('user', 'name email')
      .populate('book', 'title');

    for (const t of dueTransactions) {
      await sendNotificationWithEmail({
        userId: t.user._id,
        userEmail: t.user.email,
        userName: t.user.name,
        type: 'due_reminder',
        title: 'Book Due Reminder',
        message: `"${t.book.title}" is due in ${reminderDays} day(s)`,
        emailTemplate: 'dueReminder',
        emailArgs: [t.book.title, t.dueDate, reminderDays],
        metadata: { transactionId: t._id },
      });
    }

    logger.info(`[CRON] Due reminders: ${dueTransactions.length} sent`);
  } catch (err) {
    logger.error(`[CRON] Due reminders failed: ${err.message}`);
  }
});

// ─── Every day at 10 AM: Expire old reservations ─────────────────────────────
cron.schedule('0 10 * * *', async () => {
  try {
    const expired = await Reservation.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );
    logger.info(`[CRON] Reservation expiry: ${expired.modifiedCount} expired`);
  } catch (err) {
    logger.error(`[CRON] Reservation expiry failed: ${err.message}`);
  }
});

logger.info('[CRON] Jobs registered: overdue-update, due-reminders, reservation-expiry');
