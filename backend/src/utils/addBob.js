require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addBob() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const BOB = {
    name: 'Bob Roy',
    email: 'bob@student.com',
    password: 'Ebms@1234',
    studentId: 'STU601',
    role: 'student',
    department: 'General'
  };

  console.log(`🚀 Adding Bob Roy (${BOB.email})...`);

  // 1. Auth Creation
  const { data: auth, error } = await supabaseAdmin.auth.admin.createUser({
    email: BOB.email,
    password: BOB.password,
    email_confirm: true,
    user_metadata: { name: BOB.name, role: BOB.role }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('ℹ️ Bob already registered in Supabase.');
    } else {
        console.error('❌ Supabase Error:', error.message);
        process.exit(1);
    }
  }

  // 2. DB Creation
  const existing = await User.findOne({ email: BOB.email });
  if (!existing) {
    await User.create({
      ...BOB,
      supabaseId: auth?.user?.id || null,
      isActive: true
    });
    console.log('✅ Bob Roy added to MongoDB.');
  } else {
    if (auth?.user?.id) {
        existing.supabaseId = auth.user.id;
        await existing.save();
        console.log('✅ Updated Bob Roy with new Supabase ID.');
    } else {
        console.log('ℹ️ Bob Roy already in MongoDB.');
    }
  }

  await mongoose.disconnect();
  console.log('✨ Success!');
  process.exit(0);
}

addBob();
