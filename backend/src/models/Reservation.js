const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending',
    },
    queuePosition: { type: Number, required: true },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    fulfilledAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifiedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

reservationSchema.index({ book: 1, status: 1, queuePosition: 1 });
reservationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
