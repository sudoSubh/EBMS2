require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

async function consolidateCategories() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const consolidationMap = [
    { from: [/Art/i], to: 'Art & Design' },
    { from: [/Business/i, /Economics/i], to: 'Business & Economics' },
    { from: [/Computer/i, /Software/i, /Technology/i], to: 'Technology & CS' },
    { from: [/Science/i, /Nature/i], to: 'Science & Nature' },
    { from: [/Fiction/i, /Literature/i], to: 'Fiction & Literature' },
    { from: [/History/i], to: 'History' },
    { from: [/Philosophy/i, /Psychology/i], to: 'Philosophy & Psychology' },
    { from: [/Mystery/i, /Thriller/i], to: 'Mystery & Thriller' },
    { from: [/Medicine/i, /Health/i], to: 'Medicine & Health' },
    { from: [/Law/i, /Politics/i], to: 'Law & Politics' },
    { from: [/Travel/i, /Geography/i], to: 'Travel & Geography' },
    { from: [/Mathematics/i, /Math/i], to: 'Mathematics' },
    { from: [/Biography/i, /Memoir/i], to: 'Biography' }
  ];

  console.log('🧹 Consolidating categories for better UI display...');

  for (const mapping of consolidationMap) {
    const result = await Book.updateMany(
      { category: { $in: mapping.from } },
      { $set: { category: mapping.to } }
    );
    if (result.modifiedCount > 0) {
        console.log(`✅ Merged categories into "${mapping.to}" (${result.modifiedCount} books updated)`);
    }
  }

  // Final cleanup for anything missed
  await Book.updateMany({ category: 'General' }, { $set: { category: 'Other' } });

  console.log('\n✨ CATEGORY CLEANUP COMPLETE! Your charts will now look beautiful.');
  await mongoose.disconnect();
  process.exit(0);
}

consolidateCategories();
