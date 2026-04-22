require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function repairBobFixed() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const EMAIL = 'bob@student.com';
  console.log(`🔧 Direct repair for ${EMAIL}...`);

  // 1. Try to create him first, if he exists we'll catch the error
  const { data: auth, error } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL,
    password: 'Ebms@1234',
    email_confirm: true,
    user_metadata: { name: 'Bob Roy', role: 'student' }
  });

  let supabaseId;

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('ℹ️ User exists in Supabase. Rescuing account...');
        // We have to list and find since there's no direct "getByEmail" in standard admin auth without user_id
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const found = users.find(u => u.email === EMAIL);
        if (found) {
            supabaseId = found.id;
        } else {
            console.error('❌ Serious Error: Supabase says he exists but I cannot find him in the user list.');
            process.exit(1);
        }
    } else {
        console.error('❌ Supabase Error:', error.message);
        process.exit(1);
    }
  } else {
    supabaseId = auth.user.id;
  }

  console.log(`✅ Supabase ID Locked: ${supabaseId}`);

  // 2. Link in MongoDB
  await User.findOneAndUpdate(
    { email: EMAIL },
    { 
      name: 'Bob Roy',
      email: EMAIL,
      supabaseId: supabaseId,
      role: 'student',
      studentId: 'STU601',
      isActive: true,
      department: 'General'
    },
    { upsert: true, new: true }
  );

  console.log('✅ MongoDB Record Sync Pulse: OK');
  await mongoose.disconnect();
  console.log('✨ REPAIR SUCCESSFUL! Bob Roy can now log in.');
  process.exit(0);
}

repairBobFixed();
