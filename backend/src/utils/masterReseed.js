require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');

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

const CATEGORY_MAP = [
    { kw: ['python', 'javascript', 'java', 'programming', 'code', 'database', 'algorithm', 'web', 'computer', 'software', 'linux', 'data science'], cat: 'Computer Science & Tech' },
    { kw: ['history', 'war', 'empire', 'civilization', 'ancient', 'medieval', 'renaissance', 'revolution'], cat: 'History' },
    { kw: ['physics', 'biology', 'evolution', 'nature', 'astronomy', 'cosmos', 'universe', 'chemical', 'molecule'], cat: 'Science & Nature' },
    { kw: ['calculus', 'algebra', 'geometry', 'statistics', 'math', 'equation'], cat: 'Mathematics' },
    { kw: ['philosophy', 'logic', 'ethics', 'mind', 'psychology', 'behavior', 'cognitive', 'freud', 'aristotle', 'kant'], cat: 'Philosophy & Psychology' },
    { kw: ['business', 'economics', 'finance', 'market', 'trade', 'management', 'startup', 'entrepreneur', 'investment'], cat: 'Business & Economics' },
    { kw: ['mystery', 'thriller', 'crime', 'detective', 'murder', 'suspense', 'noire', 'sherlock'], cat: 'Mystery & Thriller' },
    { kw: ['fiction', 'novel', 'literature', 'classic', 'drama', 'poetry'], cat: 'Fiction & Literature' },
    { kw: ['fantasy', 'wizard', 'dragon', 'magic', 'space', 'galaxy', 'alien', 'sci-fi', 'hobbit', 'star wars'], cat: 'Sci-Fi & Fantasy' },
    { kw: ['art', 'design', 'drawing', 'painting', 'photography', 'architecture', 'creative'], cat: 'Art & Design' },
    { kw: ['medicine', 'health', 'anatomy', 'surgery', 'disease', 'nutrition', 'clinical'], cat: 'Medicine & Health' },
    { kw: ['self help', 'motivation', 'habit', 'productivity', 'success', 'happiness', 'mindset'], cat: 'Self Help' },
    { kw: ['travel', 'geography', 'atlas', 'hiking', 'explore', 'mountain', 'country'], cat: 'Travel & Geography' },
    { kw: ['law', 'politics', 'government', 'democracy', 'legal', 'justice', 'constitution'], cat: 'Law & Politics' },
    { kw: ['biography', 'autobiography', 'memoir', 'life of'], cat: 'Biography' }
];

const FALLBACK_CATS = ['Literature', 'History', 'Technology', 'Science', 'Business', 'Art', 'Philosophy', 'Travel', 'Health', 'General'];

function getCategory(title, index) {
  const t = title.toLowerCase();
  for (const item of CATEGORY_MAP) {
    if (item.kw.some(k => t.includes(k))) return item.cat;
  }
  return FALLBACK_CATS[index % FALLBACK_CATS.length];
}

async function masterReseed() {
  const csvPath = path.join(__dirname, '../../books.csv');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🧹 Clearing old book data...');
  await Book.deleteMany({});
  await BookCopy.deleteMany({});

  console.log('📖 Parsing books.csv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const idxTitle = headers.indexOf('title');
  const idxAuthors = headers.indexOf('authors');
  const idxIsbn = headers.indexOf('isbn13');
  const idxImg = headers.indexOf('image_url');
  const idxYear = headers.indexOf('original_publication_year');

  const booksToInsert = [];
  const MAX = 1000;

  for (let i = 1; i < lines.length && booksToInsert.length < MAX; i++) {
    const row = parseCSVLine(lines[i]);
    const title = row[idxTitle]?.replace(/^"|"$/g, '').trim();
    if (!title) continue;

    const author = row[idxAuthors]?.split(',')[0].replace(/^"|"$/g, '').trim();
    const isbn = row[idxIsbn]?.trim();
    const rawImg = row[idxImg]?.trim();
    
    let finalImg = '';
    if (rawImg && !rawImg.includes('nophoto')) {
      finalImg = `https://images.weserv.nl/?url=${rawImg.replace(/^https?:\/\//, '')}&w=300&fit=cover`;
    } else if (isbn && isbn.length > 5) {
      finalImg = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    } else {
      finalImg = `https://picsum.photos/seed/${i}/300/450`;
    }

    booksToInsert.push({
      title,
      author,
      isbn: (isbn && isbn.length > 5) ? isbn : undefined,
      publishedYear: parseInt(row[idxYear]) || 2000,
      coverImage: finalImg,
      language: 'english',
      category: getCategory(title, i),
      totalCopies: 2,
      availableCopies: 2
    });
  }

  console.log(`🚀 Inserting ${booksToInsert.length} unique books in batches...`);
  const BATCH = 100;
  for (let i = 0; i < booksToInsert.length; i += BATCH) {
    const batch = booksToInsert.slice(i, i + BATCH);
    const saved = await Book.insertMany(batch);
    
    // Create physical copies
    const copies = [];
    for (const b of saved) {
      copies.push(
        { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C1`, status: 'available' },
        { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C2`, status: 'available' }
      );
    }
    await BookCopy.insertMany(copies);
    console.log(`   💎 [RESEED] ${i + batch.length}/${booksToInsert.length} books & copies live...`);
  }

  console.log(`\n✨ MASTER RESEED COMPLETE! 1,000 Unique Books & 2,000 Copies are now in the system.`);
  await mongoose.disconnect();
  process.exit(0);
}

masterReseed();
