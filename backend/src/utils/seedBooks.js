/**
 * EBMS Real Book Seeder
 * Fetches 1000 real books from Open Library API across 22 subjects
 * Run: node src/utils/seedBooks.js
 */
require('dotenv').config();
const https = require('https');
const mongoose = require('mongoose');

// ─── Mongoose Models (inline to avoid circular dep issues) ───────────────────
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  isbn: { type: String, sparse: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  publisher: { type: String, default: '' },
  publishedYear: { type: Number },
  language: { type: String, default: 'English' },
  pages: { type: Number },
  type: { type: String, default: 'physical' },
  totalCopies: { type: Number, default: 2 },
  availableCopies: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

const copySchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  copyNumber: { type: String, required: true },
  condition: { type: String, enum: ['new','good','fair','poor','damaged'], default: 'good' },
  status: { type: String, enum: ['available','issued','reserved','lost','damaged','maintenance'], default: 'available' },
  location: { type: String, default: 'Main Shelf' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);
const BookCopy = mongoose.models.BookCopy || mongoose.model('BookCopy', copySchema);

// ─── Subjects → 22 themes, target ~50 each to overshoot then trim ────────────
const SUBJECTS = [
  { query: 'computer+science+programming',    category: 'Computer Science',     target: 55 },
  { query: 'artificial+intelligence+machine+learning', category: 'Artificial Intelligence', target: 50 },
  { query: 'mathematics+calculus+algebra',    category: 'Mathematics',          target: 55 },
  { query: 'physics+quantum',                 category: 'Physics',              target: 50 },
  { query: 'chemistry+organic',               category: 'Chemistry',            target: 45 },
  { query: 'biology+genetics+evolution',      category: 'Biology',              target: 50 },
  { query: 'world+history+ancient',           category: 'History',              target: 55 },
  { query: 'english+literature+novel',        category: 'Literature',           target: 55 },
  { query: 'philosophy+ethics',               category: 'Philosophy',           target: 45 },
  { query: 'economics+microeconomics',        category: 'Economics',            target: 50 },
  { query: 'psychology+cognitive',            category: 'Psychology',           target: 50 },
  { query: 'art+painting+design',             category: 'Art & Design',         target: 40 },
  { query: 'mechanical+electrical+engineering', category: 'Engineering',        target: 50 },
  { query: 'medicine+anatomy+health',         category: 'Medicine & Health',    target: 45 },
  { query: 'political+science+government',    category: 'Political Science',    target: 45 },
  { query: 'business+management+leadership',  category: 'Business',             target: 50 },
  { query: 'science+fiction+dystopia',        category: 'Science Fiction',      target: 45 },
  { query: 'mystery+thriller+detective',      category: 'Mystery & Thriller',   target: 40 },
  { query: 'biography+autobiography',         category: 'Biography',            target: 50 },
  { query: 'geography+environment+ecology',   category: 'Geography',            target: 40 },
  { query: 'sociology+anthropology',          category: 'Sociology',            target: 40 },
  { query: 'law+justice+constitutional',      category: 'Law',                  target: 40 },
];

const TARGET_TOTAL = 1000;
const COPIES_PER_BOOK = 2; // Each book gets 2 physical copies
const DELAY_MS = 150; // Between API calls to respect rate limits

// ─── Helpers ─────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJSON = (url) =>
  new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'EBMS-Library-Seeder/1.0 (educational project)',
        'Accept': 'application/json',
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });

const getCoverUrl = (coverId) =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';

function mapDoc(doc, category) {
  const title = (doc.title || '').trim();
  const author = (doc.author_name?.[0] || 'Unknown Author').trim();
  const isbn = doc.isbn?.[0] || '';
  const coverId = doc.cover_i;
  const publishedYear = doc.first_publish_year || null;
  const publisher = doc.publisher?.[0] || '';
  const pages = doc.number_of_pages_median || null;
  const desc = doc.first_sentence?.value || doc.subtitle || '';

  if (!title || title.length < 2) return null;
  if (author.length < 2) return null;

  return {
    title,
    author,
    isbn: isbn.length > 5 ? isbn : undefined,
    category,
    description: typeof desc === 'string' ? desc.slice(0, 600) : '',
    coverImage: getCoverUrl(coverId),
    publisher: publisher.slice(0, 100),
    publishedYear,
    pages,
    language: doc.language?.includes('eng') ? 'English' : (doc.language?.[0] || 'English'),
    type: 'physical',
    totalCopies: COPIES_PER_BOOK,
    availableCopies: COPIES_PER_BOOK,
    isActive: true,
  };
}

async function fetchSubject(subject, count) {
  const books = [];
  const pageSize = 100;
  const pages = Math.ceil(count / pageSize);

  for (let page = 0; page < pages && books.length < count; page++) {
    const offset = page * pageSize;
    const url = `https://openlibrary.org/search.json?q=${subject.query}&limit=${pageSize}&offset=${offset}&fields=title,author_name,isbn,cover_i,first_publish_year,publisher,number_of_pages_median,first_sentence,subtitle,language`;
    
    const data = await fetchJSON(url);
    await delay(DELAY_MS);

    if (!data?.docs) break;

    for (const doc of data.docs) {
      if (books.length >= count) break;
      const mapped = mapDoc(doc, subject.category);
      if (mapped) books.push(mapped);
    }
  }

  return books;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        EBMS Real Book Seeder — Open Library API         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB connected\n');

  // Get existing titles to avoid duplicates
  const existingTitles = new Set(
    (await Book.find({}, 'title').lean()).map((b) => b.title.toLowerCase())
  );
  console.log(`📚 Existing books in DB: ${existingTitles.size}\n`);

  const allBooks = [];
  const seenTitles = new Set(existingTitles);

  // ── Fetch from each subject ──
  for (const subject of SUBJECTS) {
    if (allBooks.length >= TARGET_TOTAL) break;

    const remaining = TARGET_TOTAL - allBooks.length;
    const fetchCount = Math.min(subject.target + 20, remaining + 30); // overfetch
    process.stdout.write(`\n📖 [${subject.category}] Fetching up to ${fetchCount} books...`);

    const fetched = await fetchSubject(subject, fetchCount);
    let added = 0;

    for (const book of fetched) {
      if (allBooks.length >= TARGET_TOTAL) break;
      const key = book.title.toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        allBooks.push(book);
        added++;
      }
    }

    console.log(` ✓ Added ${added} | Total: ${allBooks.length}/${TARGET_TOTAL}`);
  }

  // ── If still short, fetch more from mixed subjects ──
  if (allBooks.length < TARGET_TOTAL) {
    const extraSubjects = [
      { query: 'novel+fiction+award', category: 'Fiction', target: 60 },
      { query: 'self+help+motivation', category: 'Self Help', target: 50 },
      { query: 'astronomy+space+cosmos', category: 'Astronomy', target: 40 },
      { query: 'architecture+urban+design', category: 'Architecture', target: 40 },
    ];

    for (const subject of extraSubjects) {
      if (allBooks.length >= TARGET_TOTAL) break;
      const remaining = TARGET_TOTAL - allBooks.length;
      process.stdout.write(`\n📖 [${subject.category}] Fetching ${remaining + 20} more...`);

      const fetched = await fetchSubject(subject, remaining + 20);
      let added = 0;

      for (const book of fetched) {
        if (allBooks.length >= TARGET_TOTAL) break;
        const key = book.title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allBooks.push(book);
          added++;
        }
      }
      console.log(` ✓ Added ${added} | Total: ${allBooks.length}/${TARGET_TOTAL}`);
    }
  }

  console.log(`\n\n🎯 Final unique books to insert: ${allBooks.length}`);
  console.log('⏳ Inserting into MongoDB in batches...\n');

  // ── Batch insert books ──
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < allBooks.length; i += BATCH_SIZE) {
    const batch = allBooks.slice(i, i + BATCH_SIZE);
    try {
      const inserted_docs = await Book.insertMany(batch, { ordered: false });
      
      // Create copies for each inserted book
      const copies = [];
      for (const book of inserted_docs) {
        for (let c = 1; c <= COPIES_PER_BOOK; c++) {
          const shortId = book._id.toString().slice(-5).toUpperCase();
          copies.push({
            book: book._id,
            copyNumber: `${shortId}-C${String(c).padStart(2, '0')}`,
            condition: c === 1 ? 'new' : 'good',
            status: 'available',
            location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}-${Math.floor(Math.random() * 20) + 1}`,
            isActive: true,
          });
        }
      }

      await BookCopy.insertMany(copies, { ordered: false });
      inserted += inserted_docs.length;

      process.stdout.write(`\r  ✅ Inserted ${inserted}/${allBooks.length} books (${copies.length} copies this batch)   `);
    } catch (err) {
      // ordered:false means partial inserts succeed; duplicates just skip
      const insertedCount = err.result?.insertedCount || 0;
      inserted += insertedCount;
      process.stdout.write(`\r  ⚠ Batch partial: ${inserted} so far...   `);
    }
  }

  // ── Final Stats ──
  const finalCount = await Book.countDocuments({ isActive: true });
  const finalCopies = await BookCopy.countDocuments({ isActive: true });

  // Category breakdown
  const categories = await Book.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ SEED COMPLETE!                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Books    : ${String(finalCount).padEnd(37)}║`);
  console.log(`║  Total Copies   : ${String(finalCopies).padEnd(37)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Category Breakdown:                                     ║');
  for (const cat of categories) {
    const line = `  ${cat._id}: ${cat.count}`;
    console.log(`║  ${line.padEnd(55)}║`);
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});
