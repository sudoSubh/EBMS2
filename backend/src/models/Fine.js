const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'IssueTransaction', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    overdueDays: { type: Number, required: true },
    finePerDay: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'waived'],
      default: 'pending',
    },
    paidAt: { type: Date },
    waivedAt: { type: Date },
    waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    waivedReason: { type: String },
    paymentMethod: { type: String, enum: ['cash', 'online', 'waived'] },
    paymentReference: { type: String },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

fineSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Fine', fineSchema);
