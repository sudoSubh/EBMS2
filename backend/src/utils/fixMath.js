require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

async function fixMathImages() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('📐 Fixing Mathematics & Law images specifically...');

  // 1. All Math books get a reliable, high-res math cover
  const mathRes = await Book.updateMany(
    { category: 'Mathematics' },
    { $set: { coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop' } }
  );
  console.log(`✅ Updated ${mathRes.modifiedCount} Mathematics books with HD covers.`);

  // 2. All Law books get a reliable, high-res legal cover
  const lawRes = await Book.updateMany(
    { category: 'Law & Politics' },
    { $set: { coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop' } }
  );
  console.log(`✅ Updated ${lawRes.modifiedCount} Law & Politics books with HD covers.`);

  // 3. For any other missing images, use a global library-themed placeholder
  const generalRes = await Book.updateMany(
    { coverImage: { $regex: /nophoto|via\.placeholder|placehold\.jp/i } },
    { $set: { coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400&auto=format&fit=crop' } }
  );
  console.log(`✅ Fixed fallback for ${generalRes.modifiedCount} other books.`);

  console.log('✨ DONE! Please refresh your dashboard to see the new covers.');
  await mongoose.disconnect();
  process.exit(0);
}

fixMathImages();
