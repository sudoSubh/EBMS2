const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { cloudinary } = require('../config/cloudinary');

/**
 * GET /api/books - List books with search/filter/pagination
 */
const getBooks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    availability,
    sort = '-createdAt',
    author,
    type,
  } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = { $regex: category, $options: 'i' };
  if (author) query.author = { $regex: author, $options: 'i' };
  if (type) query.type = type;
  if (availability === 'available') query.availableCopies = { $gt: 0 };
  if (availability === 'unavailable') query.availableCopies = 0;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [books, total] = await Promise.all([
    Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-coverImagePublicId'),
    Book.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, books, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/books/:id
 */
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .populate('supplier', 'name email phone')
    .select('-coverImagePublicId');

  if (!book) return ApiResponse.notFound(res, 'Book not found');

  const copies = await BookCopy.find({ book: book._id, isActive: true }).select(
    'copyNumber status condition location barcode'
  );

  return ApiResponse.success(res, { book, copies });
});

/**
 * POST /api/books - Create book (admin/librarian)
 */
const createBook = asyncHandler(async (req, res) => {
  const bookData = { ...req.body };

  if (req.file) {
    bookData.coverImage = req.file.path;
    bookData.coverImagePublicId = req.file.filename;
  }

  const book = await Book.create(bookData);
  return ApiResponse.created(res, book, 'Book created successfully');
});

/**
 * PUT /api/books/:id - Update book
 */
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return ApiResponse.notFound(res, 'Book not found');

  const updateData = { ...req.body };

  if (req.file) {
    // Delete old image from Cloudinary
    if (book.coverImagePublicId) {
      await cloudinary.uploader.destroy(book.coverImagePublicId).catch(() => {});
    }
    updateData.coverImage = req.file.path;
    updateData.coverImagePublicId = req.file.filename;
  }

  const updated = await Book.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.success(res, updated, 'Book updated successfully');
});

/**
 * DELETE /api/books/:id - Soft delete
 */
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return ApiResponse.notFound(res, 'Book not found');

  // Check if any copies are issued
  const issuedCopies = await BookCopy.countDocuments({ book: book._id, status: 'issued' });
  if (issuedCopies > 0) {
    return ApiResponse.badRequest(res, 'Cannot delete book with active issued copies');
  }

  book.isActive = false;
  await book.save();
  return ApiResponse.success(res, null, 'Book deleted successfully');
});

/**
 * GET /api/books/categories - Get all categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category', { isActive: true });
  return ApiResponse.success(res, categories.sort());
});

/**
 * POST /api/books/:id/copies - Add a copy
 */
const addCopy = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return ApiResponse.notFound(res, 'Book not found');

  const copyCount = await BookCopy.countDocuments({ book: book._id });
  const copy = await BookCopy.create({
    book: book._id,
    copyNumber: `${book.isbn || book._id.toString().slice(-6)}-${String(copyCount + 1).padStart(3, '0')}`,
    ...req.body,
  });

  // Update book copy counts
  await Book.findByIdAndUpdate(book._id, {
    $inc: { totalCopies: 1, availableCopies: 1 },
  });

  return ApiResponse.created(res, copy, 'Copy added successfully');
});

/**
 * PUT /api/books/copies/:copyId - Update copy
 */
const updateCopy = asyncHandler(async (req, res) => {
  const copy = await BookCopy.findByIdAndUpdate(req.params.copyId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!copy) return ApiResponse.notFound(res, 'Copy not found');
  return ApiResponse.success(res, copy, 'Copy updated successfully');
});

/**
 * GET /api/books/stats - Book stats for dashboard
 */
const getBookStats = asyncHandler(async (req, res) => {
  const [totalBooks, availableBooks, issuedBooks, categoryStats] = await Promise.all([
    Book.countDocuments({ isActive: true }),
    Book.countDocuments({ isActive: true, availableCopies: { $gt: 0 } }),
    BookCopy.countDocuments({ status: 'issued' }),
    Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return ApiResponse.success(res, {
    totalBooks,
    availableBooks,
    issuedBooks,
    categoryStats,
  });
});

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
  addCopy,
  updateCopy,
  getBookStats,
  importBooks,
};

/**
 * POST /api/books/import/bulk
 * Body: { books: [...] }  — array of book objects from CSV parsed on client/script side
 */
async function importBooks(req, res) {
  try {
    // Simple secret key guard (no Supabase auth needed for this dev utility)
    const secret = req.headers['x-import-secret'] || req.body.secret;
    if (secret !== 'ebms-import-2024') {
      return res.status(403).json({ success: false, message: 'Invalid import secret' });
    }

    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return ApiResponse.badRequest(res, 'books array required');
    }

    // Get existing titles to avoid duplicates
    const existing = new Set(
      (await Book.find({}, 'title').lean()).map(b => b.title.toLowerCase())
    );

    const TARGET = 1000;
    const toInsert = [];
    const seen = new Set(existing);

    const CATEGORY_RULES = [
      { kw: ['python','javascript','java','programming','code','software','algorithm','database','web development','computer science','linux','react','data structure','coding'], cat: 'Computer Science' },
      { kw: ['machine learning','artificial intelligence','deep learning','neural','nlp'], cat: 'Artificial Intelligence' },
      { kw: ['calculus','algebra','geometry','statistics','probability','mathematics','math '], cat: 'Mathematics' },
      { kw: ['physics','quantum','relativity','mechanics','thermodynamics'], cat: 'Physics' },
      { kw: ['chemistry','organic','molecule','chemical'], cat: 'Chemistry' },
      { kw: ['biology','genetics','evolution','cell','dna','ecology'], cat: 'Biology' },
      { kw: ['history','ancient','medieval','war','empire','civilization','revolution'], cat: 'History' },
      { kw: ['psychology','cognitive','behavior','mind','mental','freud','therapy'], cat: 'Psychology' },
      { kw: ['philosophy','ethics','logic','metaphysics','plato','aristotle','kant'], cat: 'Philosophy' },
      { kw: ['economics','microeconomics','macroeconomics','market','trade','finance'], cat: 'Economics' },
      { kw: ['business','management','leadership','marketing','entrepreneur','startup'], cat: 'Business' },
      { kw: ['law','justice','legal','constitution','court','crime fiction'], cat: 'Law' },
      { kw: ['medicine','anatomy','health','disease','surgery','pharmacology','nutrition'], cat: 'Medicine & Health' },
      { kw: ['engineering','mechanical','electrical','civil'], cat: 'Engineering' },
      { kw: ['science fiction','sci-fi','dystopia','space','galaxy','alien','futur'], cat: 'Science Fiction' },
      { kw: ['mystery','thriller','detective','suspense','whodunit'], cat: 'Mystery & Thriller' },
      { kw: ['biography','autobiography','memoir','life of'], cat: 'Biography' },
      { kw: ['art','painting','sculpture','design','photography','architecture'], cat: 'Art & Design' },
      { kw: ['geography','environment','ecology','climate','nature','earth science'], cat: 'Geography' },
      { kw: ['political','politics','government','democracy','policy'], cat: 'Political Science' },
      { kw: ['sociology','society','culture','anthropology','social'], cat: 'Sociology' },
      { kw: ['self help','motivation','habit','productivity','mindset','success','happiness'], cat: 'Self Help' },
      { kw: ['astronomy','cosmos','universe','telescope','stars'], cat: 'Astronomy' },
      { kw: ['romance','love story','romantic'], cat: 'Romance' },
      { kw: ['fantasy','magic','wizard','dragon','elf','dwarf'], cat: 'Fantasy' },
    ];
    const FALLBACK = ['Literature','History','Science','Philosophy','Fiction','Biography','Psychology','Business','Art & Design','Self Help'];

    function assignCat(title, author, idx) {
      const text = (title + ' ' + author).toLowerCase();
      for (const { kw, cat } of CATEGORY_RULES) {
        if (kw.some(k => text.includes(k))) return cat;
      }
      return FALLBACK[idx % FALLBACK.length];
    }

    for (let i = 0; i < books.length && toInsert.length < TARGET; i++) {
      const b = books[i];
      if (!b.title || b.title.length < 2) continue;
      const key = b.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      let isbn = b.isbn || '';
      if (typeof isbn === 'string' && isbn.toLowerCase().includes('e+')) {
        isbn = Number(isbn).toLocaleString('fullwide', { useGrouping: false });
      }

      toInsert.push({
        ...b,
        isbn,
        category: b.category || assignCat(b.title, b.author || '', i),
        isActive: true,
      });
    }

    let inserted = 0;
    const BATCH = 50;
    const shelfLetters = 'ABCDEFGHIJ';

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      let docs = [];
      try {
        docs = await Book.insertMany(batch, { ordered: false });
      } catch (err) {
        docs = err.insertedDocs || [];
      }
      inserted += docs.length;

      if (docs.length) {
        const copies = [];
        for (const book of docs) {
          for (let c = 1; c <= 2; c++) {
            copies.push({
              book: book._id,
              copyNumber: `${book._id.toString().slice(-5).toUpperCase()}-C${String(c).padStart(2,'0')}`,
              condition: c === 1 ? 'new' : 'good',
              status: 'available',
              location: `Shelf ${shelfLetters[Math.floor(Math.random()*10)]}-${Math.floor(Math.random()*20)+1}`,
              isActive: true,
            });
          }
        }
        await BookCopy.insertMany(copies, { ordered: false }).catch(() => {});
      }
    }

    const totalBooks  = await Book.countDocuments({ isActive: true });
    const totalCopies = await BookCopy.countDocuments({ isActive: true });
    const cats = await Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);

    return ApiResponse.success(res, { inserted, totalBooks, totalCopies, categories: cats }, `Imported ${inserted} books successfully`);
  } catch (err) {
    return ApiResponse.serverError(res, err.message);
  }
}
