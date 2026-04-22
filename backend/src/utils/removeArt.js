require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');

async function removeArt() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🗑️ Removing Art & Design books...');
  const toDelete = await Book.find({ category: 'Art & Design' });
  
  const ids = toDelete.map(b => b._id);
  await BookCopy.deleteMany({ book: { $in: ids } });
  await Book.deleteMany({ _id: { $in: ids } });

  console.log(`✅ Removed ${toDelete.length} Art & Design books.`);
  await mongoose.disconnect();
  process.exit(0);
}

removeArt();
