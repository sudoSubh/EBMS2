require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');

async function cleanAndFixImages() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Remove Medicine and Education
  console.log('🗑️ Removing Medicine and Education books...');
  const toDelete = await Book.find({ 
    category: { $in: ['Medicine & Health', 'Education'] } 
  });
  
  const ids = toDelete.map(b => b._id);
  await BookCopy.deleteMany({ book: { $in: ids } });
  await Book.deleteMany({ _id: { $in: ids } });
  console.log(`✅ Removed ${toDelete.length} books and their copies.`);

  // 2. Fix Images for Mathematics and Law
  console.log('🖼️ Fixing image links for Math and Law books...');
  
  // Math books
  await Book.updateMany(
    { category: 'Mathematics' },
    { $set: { coverImage: 'https://images.gr-assets.com/books/1327891253m/6356.jpg' } } 
  );

  // Law books
  await Book.updateMany(
    { category: 'Law & Politics' },
    { $set: { coverImage: 'https://images.gr-assets.com/books/1344266315m/100.jpg' } }
  );

  console.log('✨ Cleanup and Image Fix Complete!');
  await mongoose.disconnect();
  process.exit(0);
}

cleanAndFixImages();
