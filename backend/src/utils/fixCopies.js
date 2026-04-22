require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');

async function fixMissingCopies() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const allBooks = await Book.find({});
  console.log(`🔍 Checking physical inventory for ${allBooks.length} titles...`);

  let booksFixed = 0;
  let copiesCreated = 0;

  for (const book of allBooks) {
    const existingCopies = await BookCopy.countDocuments({ book: book._id });
    
    if (existingCopies === 0) {
      // Create 2 unique physical copies
      const newCopies = [
        { 
          book: book._id, 
          copyNumber: `${book._id.toString().slice(-4)}-C1`, 
          status: 'available',
          condition: 'new'
        },
        { 
          book: book._id, 
          copyNumber: `${book._id.toString().slice(-4)}-C2`, 
          status: 'available',
          condition: 'new'
        }
      ];
      
      await BookCopy.insertMany(newCopies);
      
      // Sync the book count fields
      book.totalCopies = 2;
      book.availableCopies = 2;
      await book.save();
      
      booksFixed++;
      copiesCreated += 2;
    }
  }

  console.log('\n✨ INVENTORY REPAIR COMPLETE!');
  console.log(`✅ Titles Fixed: ${booksFixed}`);
  console.log(`📦 Physical Copies Created: ${copiesCreated}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

fixMissingCopies();
