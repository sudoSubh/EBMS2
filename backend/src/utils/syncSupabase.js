require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role allows user creation
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function syncToSupabase() {
  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all students who don't have a Supabase ID yet
    const students = await User.find({ 
      role: 'student', 
      supabaseId: { $exists: false } 
    });

    console.log(`🔍 Found ${students.length} students to sync to Supabase...`);

    const DEFAULT_PASS = 'Ebms@1234';
    let processed = 0;
    let errors = 0;

    for (const student of students) {
      try {
        console.log(`[${processed + 1}/${students.length}] Syncing: ${student.email}`);
        
        // 1. Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: student.email,
          password: DEFAULT_PASS,
          email_confirm: true,
          user_metadata: { name: student.name, role: 'student' }
        });

        if (authError) {
          // If user already exists in Supabase, try to find them to get the ID
          if (authError.message.includes('already registered')) {
             console.log(`   ⚠️ User already in Supabase auth, skipping auth creation...`);
             // We'd ideally fetch them here, but for now we skip to avoid conflicts
             continue;
          }
          throw authError;
        }

        // 2. Update MongoDB user with the Supabase ID
        student.supabaseId = authUser.user.id;
        await student.save();
        
        processed++;

        // Add a small delay to avoid hitting free-tier rate limits
        if (processed % 5 === 0) {
           await new Promise(r => setTimeout(r, 1000));
        }

      } catch (err) {
        console.error(`   ❌ Error for ${student.email}:`, err.message);
        errors++;
      }
    }

    console.log('\n✨ SYNC COMPLETE!');
    console.log(`✅ Users Processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
  }
}

syncToSupabase();
