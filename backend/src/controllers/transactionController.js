const IssueTransaction = require('../models/IssueTransaction');
const BookCopy = require('../models/BookCopy');
const Book = require('../models/Book');
const Fine = require('../models/Fine');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings, getLoanDays, getMaxBooks, calculateFine } = require('../services/settingsService');
const { sendNotificationWithEmail } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * POST /api/transactions/issue
 * Issue a book to a user
 */
const issueBook = asyncHandler(async (req, res) => {
  const { userId, bookId, copyId, notes } = req.body;
  const issuedBy = req.user._id;

  // Get target user
  const user = await User.findById(userId);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  if (!user.isActive || user.isBlocked) {
    return ApiResponse.badRequest(res, 'User account is inactive or blocked');
  }

  // Check unpaid fines
  const unpaidFines = await Fine.countDocuments({ user: userId, status: { $in: ['pending', 'partial'] } });
  if (unpaidFines > 0) {
    return ApiResponse.badRequest(res, 'User has unpaid fines. Please clear fines before issuing new books.');
  }

  // Check borrow limit
  const activeBorrows = await IssueTransaction.countDocuments({ user: userId, status: { $in: ['active', 'overdue'] } });
  const maxBooks = await getMaxBooks(user.role);
  if (activeBorrows >= maxBooks) {
    return ApiResponse.badRequest(res, `Borrow limit reached (${maxBooks} books max for ${user.role})`);
  }

  // Get book and copy
  const book = await Book.findById(bookId);
  if (!book || !book.isActive) return ApiResponse.notFound(res, 'Book not found');

  let bookCopy;
  if (copyId) {
    bookCopy = await BookCopy.findOne({ _id: copyId, book: bookId, status: 'available' });
    if (!bookCopy) return ApiResponse.badRequest(res, 'Specified copy is not available');
  } else {
    bookCopy = await BookCopy.findOne({ book: bookId, status: 'available', isActive: true });
    if (!bookCopy) return ApiResponse.badRequest(res, 'No available copies for this book');
  }

  // Calculate due date
  const loanDays = await getLoanDays(user.role);
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + loanDays);

  // Create transaction
  const settings = await getSettings();
  const transaction = await IssueTransaction.create({
    user: userId,
    book: bookId,
    bookCopy: bookCopy._id,
    issuedBy,
    issueDate,
    dueDate,
    maxRenewals: settings.borrowing.maxRenewals,
    notes,
  });

  // Update copy status
  await BookCopy.findByIdAndUpdate(bookCopy._id, { status: 'issued' });
  await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

  // Update user borrowing history
  await User.findByIdAndUpdate(userId, { $push: { borrowingHistory: transaction._id } });

  // Send notification
  await sendNotificationWithEmail({
    userId,
    userEmail: user.email,
    userName: user.name,
    type: 'book_issued',
    title: 'Book Issued',
    message: `"${book.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString('en-IN')}`,
    emailTemplate: 'bookIssued',
    emailArgs: [book.title, dueDate],
    metadata: { transactionId: transaction._id, bookId, dueDate },
  });

  logger.info(`Book issued: ${book.title} → ${user.name} (due: ${dueDate.toLocaleDateString()})`);

  const populated = await IssueTransaction.findById(transaction._id)
    .populate('user', 'name email role')
    .populate('book', 'title author isbn coverImage')
    .populate('bookCopy', 'copyNumber barcode')
    .populate('issuedBy', 'name');

  return ApiResponse.created(res, populated, 'Book issued successfully');
});

/**
 * POST /api/transactions/return
 * Return a book
 */
const returnBook = asyncHandler(async (req, res) => {
  const { transactionId, notes, condition = 'good', fineAmount = 0 } = req.body;
  const returnedTo = req.user._id;

  const transaction = await IssueTransaction.findById(transactionId)
    .populate('user', 'name email role')
    .populate('book', 'title')
    .populate('bookCopy');

  if (!transaction) return ApiResponse.notFound(res, 'Transaction not found');
  if (transaction.status === 'returned' || transaction.status === 'lost') {
    return ApiResponse.badRequest(res, `Book is already recorded as ${transaction.status}`);
  }

  const returnDate = new Date();
  const dueDate = new Date(transaction.dueDate);
  let overdueDays = 0;
  
  if (condition !== 'lost') {
     overdueDays = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
  }

  let fineRecord = null;
  let totalFineAmount = Number(fineAmount) || 0;
  let baseFineData = { fine: 0, chargeableDays: 0, finePerDay: 0 };

  // Create fine if overdue
  if (overdueDays > 0) {
    baseFineData = await calculateFine(overdueDays);
    totalFineAmount += baseFineData.fine;
  }

  if (totalFineAmount > 0) {
      fineRecord = await Fine.create({
        user: transaction.user._id,
        transaction: transaction._id,
        book: transaction.book._id,
        overdueDays,
        finePerDay: baseFineData.finePerDay || 0,
        totalAmount: totalFineAmount,
        collectedBy: returnedTo,
        notes: condition !== 'good' ? `Penalty for ${condition} book included.` : '',
      });

      // Send overdue/penalty notification
      await sendNotificationWithEmail({
        userId: transaction.user._id,
        userEmail: transaction.user.email,
        userName: transaction.user.name,
        type: 'fine_created',
        title: 'Library Fine Issued',
        message: `A fine of ₹${totalFineAmount} has been issued regarding "${transaction.book.title}" (${condition} condition).`,
        emailTemplate: 'overdueAlert',
        emailArgs: [transaction.book.title, baseFineData.chargeableDays || 0, totalFineAmount],
        metadata: { fineId: fineRecord._id, amount: totalFineAmount, condition },
      });

      // Check if user should be blocked
      const settings = await getSettings();
      const totalPendingFines = await Fine.aggregate([
        { $match: { user: transaction.user._id, status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } },
      ]);
      const pendingTotal = totalPendingFines[0]?.total || 0;

      if (pendingTotal >= settings.fines.blockOnFineAmount) {
        await User.findByIdAndUpdate(transaction.user._id, {
          isBlocked: true,
          blockedReason: `Outstanding fines exceed ₹${settings.fines.blockOnFineAmount}`,
        });
      }
  }

  // Determine statuses
  let copyStatus = 'available';
  let txStatus = 'returned';
  
  if (condition === 'lost') {
    copyStatus = 'lost';
    txStatus = 'lost';
  } else if (condition === 'damaged') {
    copyStatus = 'damaged';
  }

  // Update transaction
  transaction.status = txStatus;
  if (condition !== 'lost') {
    transaction.returnDate = returnDate;
    transaction.returnedTo = returnedTo;
  }
  if (fineRecord) transaction.fine = fineRecord._id;
  if (notes) transaction.notes = notes;
  
  // Track renewal history to mark end
  await transaction.save();

  // Update copy status and condition
  await BookCopy.findByIdAndUpdate(transaction.bookCopy._id, { 
    status: copyStatus,
    condition: condition === 'lost' ? transaction.bookCopy.condition : condition
  });
  
  // Increment available copies ONLY if the book is returning to circulation
  if (copyStatus === 'available') {
    await Book.findByIdAndUpdate(transaction.book._id, { $inc: { availableCopies: 1 } });
  }

  logger.info(`Book ${txStatus}: ${transaction.book.title} by ${transaction.user.name} (Condition: ${condition})`);

  return ApiResponse.success(res, {
    transaction,
    fine: fineRecord,
    overdueDays,
  }, `Transaction recorded successfully as ${condition}. ${fineRecord ? `Fine generated: ₹${totalFineAmount}` : ''}`);
});

/**
 * POST /api/transactions/renew
 */
const renewBook = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  const transaction = await IssueTransaction.findById(transactionId)
    .populate('user', 'name email')
    .populate('book', 'title');

  if (!transaction) return ApiResponse.notFound(res, 'Transaction not found');
  if (transaction.status !== 'active') {
    return ApiResponse.badRequest(res, 'Only active transactions can be renewed');
  }
  if (transaction.renewalCount >= transaction.maxRenewals) {
    return ApiResponse.badRequest(res, `Maximum renewal limit (${transaction.maxRenewals}) reached`);
  }

  // Cannot renew if overdue
  if (new Date() > new Date(transaction.dueDate)) {
    return ApiResponse.badRequest(res, 'Overdue books cannot be renewed. Please return the book.');
  }

  // Cannot renew if book is reserved
  const reservation = await Reservation.countDocuments({
    book: transaction.book._id,
    status: 'pending',
  });
  if (reservation > 0) {
    return ApiResponse.badRequest(res, 'Cannot renew: book has pending reservations');
  }

  const loanDays = await getLoanDays(transaction.user.role);
  const previousDueDate = transaction.dueDate;
  const newDueDate = new Date(transaction.dueDate);
  newDueDate.setDate(newDueDate.getDate() + loanDays);

  transaction.renewalHistory.push({
    renewedAt: new Date(),
    previousDueDate,
    newDueDate,
    renewedBy: req.user._id,
  });
  transaction.dueDate = newDueDate;
  transaction.renewalCount += 1;
  transaction.status = 'active';
  await transaction.save();

  return ApiResponse.success(res, transaction, `Book renewed successfully. New due date: ${newDueDate.toLocaleDateString('en-IN')}`);
});

/**
 * GET /api/transactions - List transactions with filters
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, userId, bookId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (userId) query.user = userId;
  if (bookId) query.book = bookId;

  // Students can only see their own
  if (req.user.role === 'student') {
    query.user = req.user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [transactions, total] = await Promise.all([
    IssueTransaction.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email role studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('bookCopy', 'copyNumber barcode')
      .populate('issuedBy', 'name')
      .populate('fine', 'totalAmount status'),
    IssueTransaction.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, transactions, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/transactions/:id
 */
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await IssueTransaction.findById(req.params.id)
    .populate('user', 'name email role phone studentId')
    .populate('book', 'title author isbn coverImage category')
    .populate('bookCopy', 'copyNumber barcode condition')
    .populate('issuedBy', 'name')
    .populate('returnedTo', 'name')
    .populate('fine');

  if (!transaction) return ApiResponse.notFound(res, 'Transaction not found');

  // Students can only see their own
  if (req.user.role === 'student' && transaction.user._id.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res);
  }

  return ApiResponse.success(res, transaction);
});

/**
 * GET /api/transactions/overdue - Get overdue transactions
 */
const getOverdueTransactions = asyncHandler(async (req, res) => {
  const overdueTransactions = await IssueTransaction.find({
    status: 'active',
    dueDate: { $lt: new Date() },
  })
    .populate('user', 'name email phone studentId')
    .populate('book', 'title author')
    .sort('dueDate');

  // Update statuses
  const ids = overdueTransactions.map((t) => t._id);
  if (ids.length > 0) {
    await IssueTransaction.updateMany({ _id: { $in: ids } }, { status: 'overdue' });
  }

  return ApiResponse.success(res, overdueTransactions);
});

module.exports = { issueBook, returnBook, renewBook, getTransactions, getTransaction, getOverdueTransactions };
