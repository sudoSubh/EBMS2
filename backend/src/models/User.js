const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'librarian', 'staff', 'student'],
      default: 'student',
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String },
    department: { type: String },
    employeeId: { type: String },
    studentId: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    borrowingHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IssueTransaction' }],
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
