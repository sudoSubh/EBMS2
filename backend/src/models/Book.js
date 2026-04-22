const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, unique: true, sparse: true, trim: true },
    publisher: { type: String, trim: true },
    publishedYear: { type: Number },
    edition: { type: String },
    language: { type: String, default: 'English' },
    category: { type: String, required: true },
    subcategory: { type: String },
    description: { type: String },
    coverImage: { type: String },
    coverImagePublicId: { type: String },
    pages: { type: Number },
    location: { type: String }, // shelf/rack location
    type: { type: String, enum: ['physical', 'digital', 'both'], default: 'physical' },
    digitalUrl: { type: String },
    tags: [{ type: String }],
    totalCopies: { type: Number, default: 0 },
    availableCopies: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', isbn: 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ isbn: 1 });

module.exports = mongoose.model('Book', bookSchema);
