const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const IssueTransaction = require('../models/IssueTransaction');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings } = require('../services/settingsService');

/**
 * POST /api/reservations - Reserve a book
 */
const reserveBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user._id;

  const book = await Book.findById(bookId);
  if (!book || !book.isActive) return ApiResponse.notFound(res, 'Book not found');

  // Check if book is actually available (user should issue instead)
  if (book.availableCopies > 0) {
    return ApiResponse.badRequest(res, 'Book is available. Please issue it directly.');
  }

  // Check existing reservation
  const existing = await Reservation.findOne({ user: userId, book: bookId, status: 'pending' });
  if (existing) return ApiResponse.badRequest(res, 'You already have an active reservation for this book');

  // Check active issue
  const activeIssue = await IssueTransaction.countDocuments({
    user: userId,
    book: bookId,
    status: { $in: ['active', 'overdue'] },
  });
  if (activeIssue > 0) {
    return ApiResponse.badRequest(res, 'You already have this book issued');
  }

  // Check max reservations
  const settings = await getSettings();
  const userReservations = await Reservation.countDocuments({ user: userId, status: 'pending' });
  if (userReservations >= settings.reservations.maxReservationsPerUser) {
    return ApiResponse.badRequest(res, `Maximum reservation limit (${settings.reservations.maxReservationsPerUser}) reached`);
  }

  // Calculate queue position
  const queueCount = await Reservation.countDocuments({ book: bookId, status: 'pending' });

  // Set expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + settings.reservations.reservationExpiryDays);

  const reservation = await Reservation.create({
    user: userId,
    book: bookId,
    queuePosition: queueCount + 1,
    expiresAt,
  });

  const populated = await Reservation.findById(reservation._id)
    .populate('book', 'title author coverImage')
    .populate('user', 'name email');

  return ApiResponse.created(res, populated, `Reserved successfully. Queue position: ${reservation.queuePosition}`);
});

/**
 * DELETE /api/reservations/:id - Cancel reservation
 */
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return ApiResponse.notFound(res, 'Reservation not found');

  // Only the user or staff can cancel
  if (
    reservation.user.toString() !== req.user._id.toString() &&
    !['admin', 'librarian', 'staff'].includes(req.user.role)
  ) {
    return ApiResponse.forbidden(res);
  }

  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = req.user._id;
  await reservation.save();

  // Re-queue remaining reservations
  await Reservation.updateMany(
    { book: reservation.book, status: 'pending', queuePosition: { $gt: reservation.queuePosition } },
    { $inc: { queuePosition: -1 } }
  );

  return ApiResponse.success(res, null, 'Reservation cancelled successfully');
});

/**
 * GET /api/reservations
 */
const getReservations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (req.user.role === 'student') {
    query.user = req.user._id;
  } else if (userId) {
    query.user = userId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [reservations, total] = await Promise.all([
    Reservation.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email studentId')
      .populate('book', 'title author coverImage'),
    Reservation.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, reservations, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

module.exports = { reserveBook, cancelReservation, getReservations };
