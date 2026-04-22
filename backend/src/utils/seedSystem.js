require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedSystemUsers() {
  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const systemUsers = [
      {
        name: 'System Admin',
        email: 'admin@ebms.com',
        role: 'admin',
        isActive: true,
        department: 'Administration'
      },
      {
        name: 'Head Librarian',
        email: 'librarian@ebms.com',
        role: 'librarian',
        isActive: true,
        department: 'Library'
      },
      {
        name: 'Office Staff',
        email: 'staff@ebms.com',
        role: 'staff',
        isActive: true,
        department: 'Office'
      }
    ];

    for (const u of systemUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`✅ Created ${u.role}: ${u.email}`);
      } else {
        console.log(`ℹ️ User ${u.email} already exists`);
      }
    }

    console.log('\n✨ System Users Sync Complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedSystemUsers();
