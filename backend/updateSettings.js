require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('./src/models/Settings');

async function updateLiveSettings() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔌 Connected to MongoDB');

  const result = await Settings.updateOne(
    { key: 'global' },
    { 
      $set: { 
        'borrowing.studentLoanDays': 6,
        'borrowing.staffLoanDays': 6,
        'borrowing.librarianLoanDays': 6,
        'fines.finePerDay': 5
      } 
    }
  );

  console.log('✅ Live settings updated in Database.');
  await mongoose.disconnect();
  process.exit(0);
}

updateLiveSettings();
