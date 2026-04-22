/**
 * EBMS Student Seeder
 * Reads local MOCK_DATA_Student.csv and imports students into MongoDB.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += char;
  }
  result.push(cur); return result;
}

async function run() {
  const csvPath = path.join(__dirname, '../../MOCK_DATA_Student.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: MOCK_DATA_Student.csv not found in backend folder.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }

  console.log('📖 Reading CSV file...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const col = (name) => headers.map(h => h.toLowerCase().trim()).indexOf(name.toLowerCase());
  const idxName = col('name');
  const idxEmail = col('email');
  const idxPhone = col('phone');
  const idxDept = col('department');

  console.log('🧹 Processing student records...');
  const studentsToInsert = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseCSVLine(line);
    const email = row[idxEmail]?.trim().toLowerCase();
    if (!email) continue;

    // Generate Reg No: STU001, STU002, etc.
    const regNo = `STU${String(i).padStart(3, '0')}`;

    studentsToInsert.push({
      name: row[idxName]?.trim(),
      email: email,
      phone: row[idxPhone]?.trim(),
      department: row[idxDept]?.trim(),
      studentId: regNo,
      role: 'student',
      isActive: true
    });
  }

  console.log(`🗑️ Clearing existing students (optional, but requested for cleanup)...`);
  // Note: Only clearing student role to keep admin login safe
  await User.deleteMany({ role: 'student' });

  console.log(`🚀 Inserting ${studentsToInsert.length} students...`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < studentsToInsert.length; i += BATCH_SIZE) {
    const batch = studentsToInsert.slice(i, i + BATCH_SIZE);
    await User.insertMany(batch);
    console.log(`   [PROGRESS] ${i + batch.length}/${studentsToInsert.length} students imported...`);
  }

  console.log('\n✨ STUDENT IMPORT SUCCESSFUL!');
  console.log(`👤 Total Students: ${studentsToInsert.length}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
