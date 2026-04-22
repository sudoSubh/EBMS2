const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailTemplates = {
  bookIssued: (userName, bookTitle, dueDate) => ({
    subject: `📚 Book Issued: ${bookTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:8px">
        <div style="background:#4f46e5;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="margin:0">📚 EBMS Library</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <h2 style="color:#1e293b">Book Issued Successfully!</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          <p>The following book has been issued to you:</p>
          <div style="background:#f1f5f9;padding:15px;border-radius:6px;border-left:4px solid #4f46e5">
            <strong>📖 ${bookTitle}</strong><br>
            <span style="color:#64748b">Due Date: <strong>${new Date(dueDate).toLocaleDateString('en-IN')}</strong></span>
          </div>
          <p style="margin-top:20px;color:#64748b">Please return the book on or before the due date to avoid fines.</p>
          <div style="text-align:center;margin-top:20px">
            <a href="${process.env.CLIENT_URL}/student/my-books" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View My Books</a>
          </div>
        </div>
      </div>
    `,
  }),

  dueReminder: (userName, bookTitle, dueDate, daysLeft) => ({
    subject: `⏰ Due Reminder: ${bookTitle} due in ${daysLeft} day(s)`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:8px">
        <div style="background:#f59e0b;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="margin:0">⏰ Due Date Reminder</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>This is a reminder that the following book is due in <strong>${daysLeft} day(s)</strong>:</p>
          <div style="background:#fef3c7;padding:15px;border-radius:6px;border-left:4px solid #f59e0b">
            <strong>📖 ${bookTitle}</strong><br>
            <span>Due Date: <strong>${new Date(dueDate).toLocaleDateString('en-IN')}</strong></span>
          </div>
          <p style="color:#64748b">Please return or renew the book before the due date.</p>
        </div>
      </div>
    `,
  }),

  overdueAlert: (userName, bookTitle, overdueDays, fineAmount) => ({
    subject: `🚨 Overdue Alert: ${bookTitle} - Fine ₹${fineAmount}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:8px">
        <div style="background:#ef4444;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="margin:0">🚨 Overdue Alert</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>The following book is <strong>${overdueDays} day(s) overdue</strong>:</p>
          <div style="background:#fee2e2;padding:15px;border-radius:6px;border-left:4px solid #ef4444">
            <strong>📖 ${bookTitle}</strong><br>
            <span>Fine Accumulated: <strong>₹${fineAmount}</strong></span>
          </div>
          <p style="color:#64748b">Please return the book immediately to stop further fines.</p>
        </div>
      </div>
    `,
  }),

  reservationAvailable: (userName, bookTitle) => ({
    subject: `✅ Book Available: ${bookTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:8px">
        <div style="background:#10b981;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="margin:0">✅ Reservation Available</h1>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 8px 8px">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Great news! Your reserved book is now available:</p>
          <div style="background:#d1fae5;padding:15px;border-radius:6px;border-left:4px solid #10b981">
            <strong>📖 ${bookTitle}</strong>
          </div>
          <p style="color:#64748b">Please visit the library within 3 days to collect your book. The reservation will expire after that.</p>
          <div style="text-align:center;margin-top:20px">
            <a href="${process.env.CLIENT_URL}/student/reservations" style="background:#10b981;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View Reservations</a>
          </div>
        </div>
      </div>
    `,
  }),
};

const sendEmail = async (to, templateName, ...args) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[EMAIL MOCK] To: ${to}, Template: ${templateName}`);
      return { success: true, mock: true };
    }

    const template = emailTemplates[templateName](...args);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, emailTemplates };
