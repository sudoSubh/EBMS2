require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function repairBob() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const EMAIL = 'bob@student.com';
  console.log(`🔧 Repairing connection for ${EMAIL}...`);

  // 1. Get the actual user from Supabase to find their ID
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  const supabaseUser = users.find(u => u.email === EMAIL);

  if (!supabaseUser) {
    console.error('❌ Could not find Bob in Supabase Auth. Please make sure he is registered.');
    process.exit(1);
  }

  console.log(`✅ Found Supabase ID: ${supabaseUser.id}`);

  // 2. Either update or create Bob in MongoDB with this ID
  let mongoUser = await User.findOne({ email: EMAIL });
  
  if (mongoUser) {
    mongoUser.supabaseId = supabaseUser.id;
    mongoUser.isActive = true;
    await mongoUser.save();
    console.log('✅ Successfully linked existing MongoDB user to Supabase.');
  } else {
    await User.create({
      name: 'Bob Roy',
      email: EMAIL,
      supabaseId: supabaseUser.id,
      role: 'student',
      studentId: 'STU601',
      isActive: true,
      department: 'General'
    });
    console.log('✅ Created new MongoDB user for Bob and linked to Supabase.');
  }

  await mongoose.disconnect();
  console.log('✨ Bob Roy can now log in!');
  process.exit(0);
}

repairBob();
