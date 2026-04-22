require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');

async function repairIsbns() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔌 Connected to MongoDB');

  // Find books where ISBN contains 'e+'
  const booksToFix = await Book.find({ isbn: /e\+/i });
  console.log(`🔍 Found ${booksToFix.length} books with scientific notation ISBNs.`);

  let fixCount = 0;
  for (const book of booksToFix) {
    const originalIsbn = book.isbn;
    // Convert scientific notation string to full numeric string
    // Example: "9.78043902348e+12" -> 9780439023480
    const numericValue = Number(originalIsbn);
    
    if (!isNaN(numericValue)) {
      const fixedIsbn = numericValue.toLocaleString('fullwide', { useGrouping: false });
      
      // Verification: Standard ISBN-13 has 13 digits.
      // If it's shorter, it might have lost a trailing digit due to rounding or was originally shorter.
      // However, we must be careful not to create duplicates.
      
      await Book.findByIdAndUpdate(book._id, { isbn: fixedIsbn });
      fixCount++;
    }
  }

  console.log(`✅ Successfully repaired ${fixCount} ISBNs.`);
  await mongoose.disconnect();
}

repairIsbns().catch(err => {
  console.error('❌ Repair failed:', err);
  process.exit(1);
});
