require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const User = require('./src/models/User');

async function updateStudents() {
  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }

  // 1. Read Excel Data
  const excelPath = path.join(__dirname, 'name_regd.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const newData = XLSX.utils.sheet_to_json(sheet); // [{ Name, "Regd No" }]

  console.log(`📊 Found ${newData.length} new identities in Excel.`);

  // 2. Fetch Students from DB (Exclude Admin, Librarian, Staff, and Bob Roy)
  // Bob Roy is stu601 or bob@student.com
  const students = await User.find({ 
    role: 'student', 
    email: { $ne: 'bob@student.com' },
    studentId: { $ne: 'STU601' } 
  });

  console.log(`👤 Found ${students.length} existing students to update.`);

  // 3. Shuffle New Data for Random Assignment
  const shuffledData = newData.sort(() => Math.random() - 0.5);

  // 4. Update Students
  let updateCount = 0;
  const totalToUpdate = Math.min(students.length, shuffledData.length);

  console.log(`🚀 Updating ${totalToUpdate} students...`);

  for (let i = 0; i < totalToUpdate; i++) {
    const student = students[i];
    const identity = shuffledData[i];

    await User.findByIdAndUpdate(student._id, {
      name: identity.Name,
      studentId: identity['Regd No']
    });

    if ((i + 1) % 100 === 0) {
      console.log(`   [PROGRESS] ${i + 1}/${totalToUpdate} updated...`);
    }
    updateCount++;
  }

  console.log(`\n✨ SUCCESS! Updated ${updateCount} student records.`);
  console.log('ℹ️ Emails and Phones remained unchanged.');
  console.log('ℹ️ Bob Roy (STU601), Librarians, Admins, and Staff were not touched.');

  await mongoose.disconnect();
  process.exit(0);
}

updateStudents().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
