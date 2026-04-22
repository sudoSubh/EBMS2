const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, trim: true },
    contactPerson: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    gstin: { type: String },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
