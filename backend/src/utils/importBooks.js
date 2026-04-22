/**
 * EBMS CSV Book Importer
 * Imports 1000 books from goodbooks-10k dataset CSV
 *
 * Usage:
 *   node src/utils/importBooks.js                    ← uses ./books.csv by default
 *   node src/utils/importBooks.js path/to/books.csv  ← custom path
 *
 * Download the CSV from:
 *   https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv
 * Drop books.csv into: EBMS2/backend/books.csv
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ─── Inline models to avoid circular deps ────────────────────────────────────
const bookSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  author:          { type: String, required: true },
  isbn:            { type: String, sparse: true },
  category:        { type: String, required: true },
  description:     { type: String, default: '' },
  coverImage:      { type: String, default: '' },
  publisher:       { type: String, default: '' },
  publishedYear:   { type: Number },
  language:        { type: String, default: 'English' },
  pages:           { type: Number },
  type:            { type: String, default: 'physical' },
  totalCopies:     { type: Number, default: 2 },
  availableCopies: { type: Number, default: 2 },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

const copySchema = new mongoose.Schema({
  book:       { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  copyNumber: { type: String, required: true },
  condition:  { type: String, enum: ['new','good','fair','poor','damaged'], default: 'good' },
  status:     { type: String, enum: ['available','issued','reserved','lost','damaged','maintenance'], default: 'available' },
  location:   { type: String, default: 'Main Shelf' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

const Book     = mongoose.models.Book     || mongoose.model('Book',     bookSchema);
const BookCopy = mongoose.models.BookCopy || mongoose.model('BookCopy', copySchema);

// ─── Category assignment based on keywords in title/author ───────────────────
const CATEGORY_RULES = [
  { keywords: ['python','javascript','java','programming','code','software','algorithm','database','web','computer','linux','react','data structure'], category: 'Computer Science' },
  { keywords: ['machine learning','artificial intelligence','deep learning','neural','ai ','nlp'], category: 'Artificial Intelligence' },
  { keywords: ['calculus','algebra','geometry','statistics','probability','mathematics','math','number theory'], category: 'Mathematics' },
  { keywords: ['physics','quantum','relativity','mechanics','thermodynamics','optics','electro'], category: 'Physics' },
  { keywords: ['chemistry','organic','molecule','reaction','periodic','chemical'], category: 'Chemistry' },
  { keywords: ['biology','genetics','evolution','cell','dna','ecology','microbio','botany','zoology'], category: 'Biology' },
  { keywords: ['history','ancient','medieval','war','empire','civilization','revolution','century'], category: 'History' },
  { keywords: ['psychology','cognitive','behavior','mind','mental','freud','therapy','brain'], category: 'Psychology' },
  { keywords: ['philosophy','ethics','logic','metaphysics','epistemology','plato','aristotle','kant'], category: 'Philosophy' },
  { keywords: ['economics','microeconomics','macroeconomics','market','trade','finance','gdp','capitalism'], category: 'Economics' },
  { keywords: ['business','management','leadership','marketing','entrepreneur','startup','strategy'], category: 'Business' },
  { keywords: ['law','justice','legal','constitution','court','crime','rights','judiciary'], category: 'Law' },
  { keywords: ['medicine','anatomy','health','disease','surgery','pharmacology','nutrition','clinical'], category: 'Medicine & Health' },
  { keywords: ['engineering','mechanical','electrical','civil','chemical engineering','thermodynamics'], category: 'Engineering' },
  { keywords: ['science fiction','sci-fi','dystopia','space travel','galaxy','alien','futur'], category: 'Science Fiction' },
  { keywords: ['mystery','thriller','detective','crime fiction','suspense','whodunit'], category: 'Mystery & Thriller' },
  { keywords: ['biography','autobiography','memoir','life of','story of'], category: 'Biography' },
  { keywords: ['art','painting','sculpture','design','photography','architecture','aesthetic'], category: 'Art & Design' },
  { keywords: ['geography','environment','ecology','climate','planet','nature','earth'], category: 'Geography' },
  { keywords: ['political','politics','government','democracy','policy','international relations'], category: 'Political Science' },
  { keywords: ['sociology','society','culture','anthropology','social','community'], category: 'Sociology' },
  { keywords: ['self help','motivation','habit','productivity','mindset','success','happiness'], category: 'Self Help' },
  { keywords: ['astronomy','cosmos','universe','telescope','planet','stars','space'], category: 'Astronomy' },
  { keywords: ['novel','fiction','story','tale','romance'], category: 'Fiction' },
  { keywords: ['poetry','poem','verse','sonnet'], category: 'Poetry' },
];

const FALLBACK_CATEGORIES = [
  'Literature','History','Science','Philosophy','Fiction','Biography',
  'Psychology','Business','Art & Design','Geography'
];

function assignCategory(title, author, idx) {
  const text = (title + ' ' + author).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  // Round-robin fallback
  return FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length];
}

// Language code → label
function langLabel(code) {
  const map = { eng: 'English', en: 'English', fre: 'French', ger: 'German',
    spa: 'Spanish', ita: 'Italian', por: 'Portuguese', ara: 'Arabic',
    hin: 'Hindi', zho: 'Chinese', jpn: 'Japanese' };
  return map[code?.toLowerCase()] || 'English';
}

// ─── Parse CSV (handles quoted fields) ───────────────────────────────────────
function parseCSV(content) {
  const lines  = content.split('\n');
  const header = parseCSVLine(lines[0]);
  const rows   = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    if (values.length < header.length - 2) continue; // skip malformed
    const row = {};
    header.forEach((h, j) => { row[h.trim()] = (values[j] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2] || path.join(__dirname, '../../books.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ CSV file not found at: ${csvPath}`);
    console.error('\n📥 Download it from:');
    console.error('   https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv');
    console.error('\nThen place it at:');
    console.error('   EBMS2/backend/books.csv\n');
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          EBMS CSV Book Importer — goodbooks-10k          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`📄 Reading: ${csvPath}`);

  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows    = parseCSV(content);
  console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB connected\n');

  // Get existing titles to skip duplicates
  const existing = new Set(
    (await Book.find({}, 'title').lean()).map(b => b.title.toLowerCase())
  );
  console.log(`📚 Existing books in DB: ${existing.size}`);

  // ── Map CSV rows to Book documents ──────────────────────────────────────────
  const TARGET = 1000;
  const books  = [];
  const seen   = new Set(existing);

  for (let i = 0; i < rows.length && books.length < TARGET; i++) {
    const r = rows[i];

    const title  = (r.title || r.original_title || '').replace(/^\s*"|"\s*$/g, '').trim();
    const author = (r.authors || '').split(',')[0].trim();
    let isbn   = r.isbn13 || r.isbn || '';
    if (isbn.toLowerCase().includes('e+')) {
      isbn = Number(isbn).toLocaleString('fullwide', { useGrouping: false });
    }
    const year   = parseInt(r.original_publication_year) || null;
    const cover  = (r.image_url || '').replace('._SX98_', '._SX200_'); // bigger image
    const lang   = langLabel(r.language_code);
    const pages  = parseInt(r.num_pages) || null;

    if (!title || title.length < 2 || !author || author.length < 2) continue;
    if (seen.has(title.toLowerCase())) continue;

    const category = assignCategory(title, author, i);

    seen.add(title.toLowerCase());
    books.push({
      title, author,
      isbn: isbn.length > 5 ? isbn : undefined,
      category,
      description: '',
      coverImage: cover,
      publisher: r.publisher || '',
      publishedYear: year,
      language: lang,
      pages,
      type: 'physical',
      totalCopies: 2,
      availableCopies: 2,
      isActive: true,
    });
  }

  console.log(`🎯 Unique books to import: ${books.length}\n`);
  console.log('⏳ Inserting into MongoDB...\n');

  // ── Batch insert ─────────────────────────────────────────────────────────────
  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < books.length; i += BATCH) {
    const batch  = books.slice(i, i + BATCH);
    let docs = [];

    try {
      docs = await Book.insertMany(batch, { ordered: false });
    } catch (err) {
      // Partial success on duplicate key errors
      docs = err.insertedDocs || [];
      if (!docs.length && err.result?.ops) docs = err.result.ops;
    }

    inserted += docs.length;

    // Create 2 copies per book
    if (docs.length) {
      const copies = [];
      const shelfLetters = 'ABCDEFGHIJ';
      for (const book of docs) {
        for (let c = 1; c <= 2; c++) {
          const id = book._id.toString().slice(-5).toUpperCase();
          copies.push({
            book:       book._id,
            copyNumber: `${id}-C${String(c).padStart(2, '0')}`,
            condition:  c === 1 ? 'new' : 'good',
            status:     'available',
            location:   `Shelf ${shelfLetters[Math.floor(Math.random() * 10)]}-${Math.floor(Math.random() * 20) + 1}`,
            isActive:   true,
          });
        }
      }
      await BookCopy.insertMany(copies, { ordered: false }).catch(() => {});
    }

    const pct = Math.round((inserted / books.length) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}% — ${inserted}/${books.length} books   `);
  }

  // ── Final Summary ─────────────────────────────────────────────────────────────
  const totalBooks  = await Book.countDocuments({ isActive: true });
  const totalCopies = await BookCopy.countDocuments({ isActive: true });
  const cats = await Book.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const booksWithCover = await Book.countDocuments({ isActive: true, coverImage: { $ne: '' } });

  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   ✅  IMPORT COMPLETE!                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Books in DB  : ${String(totalBooks).padEnd(34)}║`);
  console.log(`║  Books Imported Now : ${String(inserted).padEnd(34)}║`);
  console.log(`║  Total Copies       : ${String(totalCopies).padEnd(34)}║`);
  console.log(`║  With Cover Images  : ${String(booksWithCover).padEnd(34)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Category Breakdown:                                     ║');
  for (const c of cats) {
    const line = `  ${c._id}: ${c.count}`;
    console.log(`║${line.padEnd(58)}║`);
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
