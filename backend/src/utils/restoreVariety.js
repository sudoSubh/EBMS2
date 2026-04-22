require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Book = require('../models/Book');

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

async function restoreVariety() {
  const csvPath = path.join(__dirname, '../../books.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: books.csv not found.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('📖 Reading dataset for unique covers...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const idxTitle = headers.indexOf('title');
  const idxImg = headers.indexOf('image_url');

  const coverMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row[idxTitle] && row[idxImg]) {
      const cleanTitle = row[idxTitle].replace(/^"|"$/g, '').trim();
      coverMap.set(cleanTitle, row[idxImg]);
    }
  }

  console.log('🖼️ Restoring unique covers to database...');
  const books = await Book.find({});
  let updatedCount = 0;

  for (const book of books) {
    let uniqueImg = coverMap.get(book.title);
    
    if (uniqueImg && !uniqueImg.includes('nophoto')) {
      // Use proxy for the unique original image
      const cleanUrl = uniqueImg.replace(/^https?:\/\//, '');
      book.coverImage = `https://images.weserv.nl/?url=${cleanUrl}&w=300&fit=cover`;
    } else {
      // Use a random Unsplash image based on ID so it's consistent for this book but unique globally
      const randomSeed = book._id.toString().slice(-3);
      book.coverImage = `https://picsum.photos/seed/${randomSeed}/300/450`;
    }

    await book.save();
    updatedCount++;
    if (updatedCount % 100 === 0) console.log(`   🎨 [VARIETY] ${updatedCount}/${books.length} covers restored...`);
  }

  console.log(`✨ SUCCESS! Restored ${updatedCount} unique covers.`);
  await mongoose.disconnect();
  process.exit(0);
}

restoreVariety();
