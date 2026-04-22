/**
 * EBMS 1K Book Seeder
 * Reads local books.csv, cleans data, and imports 1000 records.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ─── Inline Models ──────────────────────────────────────────────────────────
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  isbn: { type: String },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  publishedYear: { type: Number },
  language: { type: String, default: 'English' },
  totalCopies: { type: Number, default: 2 },
  availableCopies: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const copySchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  copyNumber: { type: String, required: true },
  condition: { type: String, default: 'good' },
  status: { type: String, default: 'available' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);
const BookCopy = mongoose.models.BookCopy || mongoose.model('BookCopy', copySchema);

// ─── Data Cleaning & Category Logic ─────────────────────────────────────────
const CATEGORY_MAP = [
  { kw: ['python', 'javascript', 'java', 'programming', 'code', 'database', 'algorithm', 'web', 'computer', 'software', 'linux', 'data science'], cat: 'Computer Science & Tech' },
  { kw: ['history', 'war', 'empire', 'civilization', 'ancient', 'medieval', 'renaissance', 'revolution'], cat: 'History' },
  { kw: ['physics', 'biology', 'evolution', 'nature', 'astronomy', 'cosmos', 'universe', 'chemical', 'molecule'], cat: 'Science & Nature' },
  { kw: ['calculus', 'algebra', 'geometry', 'statistics', 'math'], cat: 'Mathematics' },
  { kw: ['philosophy', 'logic', 'ethics', 'mind', 'psychology', 'behavior', 'cognitive', 'freud', 'aristotle', 'kant'], cat: 'Philosophy & Psychology' },
  { kw: ['business', 'economics', 'finance', 'market', 'trade', 'management', 'startup', 'entrepreneur', 'investment'], cat: 'Business & Economics' },
  { kw: ['mystery', 'thriller', 'crime', 'detective', 'murder', 'suspense', 'noire', 'sherlock'], cat: 'Mystery & Thriller' },
  { kw: ['fiction', 'novel', 'literature', 'classic', 'classic', 'drama', 'poetry'], cat: 'Fiction & Literature' },
  { kw: ['fantasy', 'wizard', 'dragon', 'magic', 'space', 'galaxy', 'alien', 'sci-fi', 'fiction', 'hobbit', 'star wars'], cat: 'Sci-Fi & Fantasy' },
  { kw: ['art', 'design', 'drawing', 'painting', 'photography', 'architecture', 'creative'], cat: 'Art & Design' },
  { kw: ['medicine', 'health', 'anatomy', 'surgery', 'disease', 'nutrition', 'clinical'], cat: 'Medicine & Health' },
  { kw: ['self help', 'motivation', 'habit', 'productivity', 'success', 'happiness', 'mindset'], cat: 'Self Help' },
  { kw: ['travel', 'geography', 'atlas', 'hiking', 'explore', 'mountain', 'country'], cat: 'Travel & Geography' },
  { kw: ['law', 'politics', 'government', 'democracy', 'legal', 'justice', 'constitution'], cat: 'Law & Politics' },
  { kw: ['biography', 'autobiography', 'memoir', 'life of'], cat: 'Biography' }
];

const FALLBACK_CATS = ['Literature', 'History', 'Science', 'Technology', 'Art', 'Business', 'Philosophy', 'Travel', 'Health', 'General'];

function getCategory(title, index) {
  const t = title.toLowerCase();
  for (const item of CATEGORY_MAP) {
    if (item.kw.some(k => t.includes(k))) return item.cat;
  }
  return FALLBACK_CATS[index % FALLBACK_CATS.length];
}

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

// ─── Main Execution ─────────────────────────────────────────────────────────
async function run() {
  const csvPath = path.join(__dirname, '../../books.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: books.csv not found in backend folder.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected');
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }

  console.log('📖 Reading CSV file...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const col = (name) => headers.indexOf(name);
  const idxTitle = col('title');
  const idxAuthors = col('authors');
  const idxIsbn = col('isbn13');
  const idxYear = col('original_publication_year');
  const idxImg = col('image_url');
  const idxLang = col('language_code');

  const booksToInsert = [];
  const MAX_RECORDS = 800;
  
  console.log(`🧹 Processing ${MAX_RECORDS} records...`);

  for (let i = 1; i < lines.length && booksToInsert.length < MAX_RECORDS; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseCSVLine(line);
    const title = row[idxTitle]?.replace(/^"|"$/g, '').trim();
    const authorsRaw = row[idxAuthors]?.replace(/^"|"$/g, '').trim();
    
    if (!title || !authorsRaw) continue;

    const author = authorsRaw.split(',')[0].trim();

    booksToInsert.push({
      title,
      author,
      isbn: row[idxIsbn] && row[idxIsbn].length > 5 ? row[idxIsbn] : undefined,
      publishedYear: parseInt(row[idxYear]) || null,
      coverImage: row[idxImg]?.replace('._SX98_', '._SX200_') || '',
      language: 'english', // Fix for MongoBulkWriteError
      category: getCategory(title, i),
      totalCopies: 2,
      availableCopies: 2
    });
  }

  console.log(`🗑️ Clearing old data...`);
  await Book.deleteMany({});
  await BookCopy.deleteMany({});

  console.log(`🚀 Inserting ${booksToInsert.length} books in batches...`);
  const BATCH_SIZE = 100;
  let insertedCount = 0;

  for (let i = 0; i < booksToInsert.length; i += BATCH_SIZE) {
    const batch = booksToInsert.slice(i, i + BATCH_SIZE);
    const saved = await Book.insertMany(batch);
    insertedCount += saved.length;

    const copies = [];
    for (const b of saved) {
      copies.push(
        { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C1` },
        { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C2` }
      );
    }
    await BookCopy.insertMany(copies);
    console.log(`   [PROGRESS] ${insertedCount}/${booksToInsert.length} books imported...`);
  }

  console.log('\n✨ IMPORT SUCCESSFUL!');
  console.log(`📚 Total Books: ${insertedCount}`);
  console.log(`📖 Total Copies: ${insertedCount * 2}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
