const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    copyNumber: { type: String, required: true },
    barcode: { type: String, unique: true, sparse: true },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
    },
    status: {
      type: String,
      enum: ['available', 'issued', 'reserved', 'lost', 'damaged', 'maintenance'],
      default: 'available',
    },
    location: { type: String },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookCopySchema.index({ book: 1, status: 1 });

module.exports = mongoose.model('BookCopy', bookCopySchema);
