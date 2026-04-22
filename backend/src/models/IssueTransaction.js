const mongoose = require('mongoose');

const issueTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookCopy: { type: mongoose.Schema.Types.ObjectId, ref: 'BookCopy', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    returnedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    renewalCount: { type: Number, default: 0 },
    maxRenewals: { type: Number, default: 2 },
    renewalHistory: [
      {
        renewedAt: Date,
        previousDueDate: Date,
        newDueDate: Date,
        renewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'lost', 'renewed'],
      default: 'active',
    },
    fine: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine' },
    notes: { type: String },
  },
  { timestamps: true }
);

issueTransactionSchema.index({ user: 1, status: 1 });
issueTransactionSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('IssueTransaction', issueTransactionSchema);
