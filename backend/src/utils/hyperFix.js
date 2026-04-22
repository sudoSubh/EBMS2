require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

async function hyperFixImages() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const books = await Book.find({});
  console.log(`🖼️ Applying Hyper-Relay to ${books.length} book covers...`);

  let count = 0;
  for (const book of books) {
    let original = book.coverImage;
    
    if (!original || original.includes('nophoto')) {
      // Use category-based professional placeholder
      const cat = book.category ? encodeURIComponent(book.category) : 'Book';
      book.coverImage = `https://ui-avatars.com/api/?name=${cat}&background=3a5a40&color=fff&size=200`;
    } else {
      // Wrap through images.weserv.nl proxy to bypass character/hotlink blocks
      // We clean the URL first
      const cleanUrl = original.replace(/^https?:\/\//, '');
      book.coverImage = `https://images.weserv.nl/?url=${cleanUrl}&w=300&h=450&fit=cover&errorproxy=https://via.placeholder.com/300x450?text=No+Cover`;
    }

    await book.save();
    count++;
    if (count % 100 === 0) console.log(`   ⚡ [RELAY] ${count}/${books.length} covers proxied...`);
  }

  console.log(`✨ HYPER-FIX COMPLETE! All ${count} books now use high-reliability proxies.`);
  await mongoose.disconnect();
  process.exit(0);
}

hyperFixImages();
