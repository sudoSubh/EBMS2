/**
 * EBMS CSV → API Importer
 * Reads books.csv locally, parses it, and POSTs to the running backend API
 * This avoids Atlas connection conflicts with nodemon
 *
 * Usage: node src/utils/sendBooksToAPI.js
 */
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const CSV_PATH   = process.argv[2] || path.join(__dirname, '../../books.csv');
const API_BASE   = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ebms.com';
const ADMIN_PASS  = 'Ebms@1234';

// ── Simple HTTP helper ────────────────────────────────────
function request(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = lib.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── CSV Parser ─────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n');
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVLine(lines[i]);
    if (vals.length < header.length - 3) continue;
    const row = {};
    header.forEach((h, j) => { row[h.trim()] = (vals[j] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function langLabel(code) {
  const m = { eng:'English',en:'English','en-US':'English','en-CA':'English','en-GB':'English',fre:'French',ger:'German',spa:'Spanish',ita:'Italian' };
  return m[code] || 'English';
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     EBMS CSV → API Book Importer                 ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV not found at:', CSV_PATH); process.exit(1);
  }

  // Parse CSV
  console.log('📄 Parsing CSV...');
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'));
  console.log(`✅ ${rows.length} rows parsed\n`);

  // Map to book objects
  const books = [];
  const seen = new Set();
  for (let i = 0; i < rows.length && books.length < 1010; i++) {
    const r = rows[i];
    const title  = (r.title || r.original_title || '').replace(/^"|"$/g, '').trim();
    const author = (r.authors || '').split(',')[0].trim();
    if (!title || title.length < 2 || !author || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    const isbn   = (r.isbn13 || r.isbn || '').replace(/[^0-9X]/g, '');
    const year   = parseInt(r.original_publication_year) || null;
    const cover  = (r.image_url || '').replace('._SX98_', '._SX200_').replace('._SY75_','._SX200_');
    books.push({
      title, author,
      isbn: isbn.length > 5 ? isbn : undefined,
      description: '',
      coverImage: cover,
      publisher: '',
      publishedYear: year && year > 0 ? year : undefined,
      language: langLabel(r.language_code),
      type: 'physical',
      totalCopies: 2,
      availableCopies: 2,
    });
  }
  console.log(`📚 ${books.length} unique books ready to import\n`);

  // Send in batches of 200 to stay within body limits
  const CHUNK = 200;
  let totalInserted = 0;

  for (let i = 0; i < books.length; i += CHUNK) {
    const chunk = books.slice(i, i + CHUNK);
    process.stdout.write(`⏳ Sending batch ${Math.floor(i/CHUNK)+1}/${Math.ceil(books.length/CHUNK)} (${chunk.length} books)...`);
    const res = await request(`${API_BASE}/api/books/import/bulk`, 'POST', { books: chunk, secret: 'ebms-import-2024' });
    if (res.status === 200) {
      totalInserted += res.body.data?.inserted || 0;
      console.log(` ✓ inserted: ${res.body.data?.inserted || 0} | DB total: ${res.body.data?.totalBooks || '?'}`);
    } else {
      console.log(` ⚠ Status ${res.status}: ${JSON.stringify(res.body).slice(0,120)}`);
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              ✅  IMPORT COMPLETE!                ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  Books imported this run : ${String(totalInserted).padEnd(23)}║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
