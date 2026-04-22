const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    library: {
      name: { type: String, default: 'EBMS Library' },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      logo: { type: String },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    borrowing: {
      studentMaxBooks: { type: Number, default: 5 },
      staffMaxBooks: { type: Number, default: 10 },
      librarianMaxBooks: { type: Number, default: 15 },
      studentLoanDays: { type: Number, default: 6 },
      staffLoanDays: { type: Number, default: 6 },
      librarianLoanDays: { type: Number, default: 6 },
      maxRenewals: { type: Number, default: 2 },
    },
    fines: {
      finePerDay: { type: Number, default: 5 },
      gracePeriodDays: { type: Number, default: 0 },
      maxFineAmount: { type: Number, default: 500 },
      blockOnFineAmount: { type: Number, default: 100 },
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' },
    },
    reservations: {
      maxReservationsPerUser: { type: Number, default: 3 },
      reservationExpiryDays: { type: Number, default: 3 },
    },
    notifications: {
      dueDateReminderDays: { type: Number, default: 2 },
      enableEmailNotifications: { type: Boolean, default: true },
      enableSMSNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
