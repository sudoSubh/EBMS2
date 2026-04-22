require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepRepair() {
  await mongoose.connect(process.env.MONGO_URI);
  const EMAIL = 'bob@student.com';
  console.log(`🔍 Deep searching for ${EMAIL} in Supabase...`);

  let bobId = null;
  let page = 1;
  const perPage = 50;

  // Search through all pages of users
  while (!bobId) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });

    if (error || !users || users.length === 0) break;

    const found = users.find(u => u.email === EMAIL);
    if (found) {
      bobId = found.id;
      break;
    }
    page++;
    if (page > 50) break; // Safety cutoff
  }

  if (!bobId) {
    console.log(`⚠️ Bob not found in existing list. Creating fresh account...`);
    const { data: auth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL,
      password: 'Ebms@1234',
      email_confirm: true,
      user_metadata: { name: 'Bob Roy', role: 'student' }
    });
    
    if (createError) {
       console.error('❌ Fatal Supabase Error:', createError.message);
       process.exit(1);
    }
    bobId = auth.user.id;
  }

  console.log(`✅ Supabase ID Found: ${bobId}`);

  // Sync MongoDB
  await User.findOneAndUpdate(
    { email: EMAIL },
    { 
      name: 'Bob Roy',
      email: EMAIL,
      supabaseId: bobId,
      role: 'student',
      studentId: 'STU601',
      isActive: true,
      department: 'General'
    },
    { upsert: true, new: true }
  );

  console.log('✅ MongoDB Linked Successfully.');
  await mongoose.disconnect();
  console.log('✨ Bob Roy is now AUTHORIZED and ready to log in!');
  process.exit(0);
}

deepRepair();
