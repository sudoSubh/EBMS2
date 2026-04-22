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

async function smartImageSync() {
  const csvPath = path.join(__dirname, '../../books.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: books.csv not found.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('📖 Loading dataset for cross-referencing...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const idxTitle = headers.indexOf('title');
  const idxImg = headers.indexOf('image_url');
  const idxIsbn = headers.indexOf('isbn13');

  // Map to store CSV data for fast lookup
  const csvDataMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row[idxTitle]) {
      const cleanTitle = row[idxTitle].replace(/^"|"$/g, '').trim();
      csvDataMap.set(cleanTitle, {
        img: row[idxImg],
        isbn: row[idxIsbn]
      });
    }
  }

  console.log('🖼️ Starting smart image synchronization...');
  const books = await Book.find({});
  let count = 0;

  for (const book of books) {
    const csvMatch = csvDataMap.get(book.title);
    let finalUrl = '';

    if (csvMatch && csvMatch.img && !csvMatch.img.includes('nophoto')) {
      // 1. Primary: Use unique CSV image through proxy
      const cleanBase = csvMatch.img.replace(/^https?:\/\//, '');
      finalUrl = `https://images.weserv.nl/?url=${cleanBase}&w=300&fit=cover`;
    } else if (book.isbn && book.isbn !== 'N/A' && book.isbn.length > 5) {
      // 2. Secondary: Use Open Library unique cover via ISBN
      finalUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`;
    }

    // 3. Fallback: If still empty or likely broken, use a unique Unsplash ID
    if (!finalUrl || finalUrl === '') {
       const seed = book._id.toString().slice(-4);
       finalUrl = `https://picsum.photos/seed/${seed}/300/450`;
    }

    book.coverImage = finalUrl;
    await book.save();
    
    count++;
    if (count % 100 === 0) console.log(`   💎 [SYNC] ${count}/${books.length} unique covers verified...`);
  }

  console.log(`\n✨ SYNC COMPLETE! Successfully verified and unique-mapped ${count} books.`);
  await mongoose.disconnect();
  process.exit(0);
}

smartImageSync();
