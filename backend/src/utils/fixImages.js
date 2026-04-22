require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

async function fixAllImages() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🖼️ Upgrading all book covers to high-reliability smart placeholders...');
  
  const books = await Book.find({});
  let count = 0;

  for (const book of books) {
    // We use a dynamic placeholder service that includes the book title for a "real" feel
    const encodedTitle = encodeURIComponent(book.title);
    const newUrl = `https://placehold.jp/24/3a5a40/ffffff/200x300.png?text=${encodedTitle}`;
    
    // BUT, we'll try a more "book-like" service first:
    const bookUrl = `https://via.placeholder.com/200x300/1a1a1a/ffffff?text=${encodedTitle}`;
    
    book.coverImage = bookUrl;
    await book.save();
    count++;
    
    if (count % 100 === 0) console.log(`   [PROGRESS] ${count}/${books.length} images fixed...`);
  }

  console.log(`✨ DONE! Fixed ${count} book images.`);
  await mongoose.disconnect();
  process.exit(0);
}

fixAllImages();
