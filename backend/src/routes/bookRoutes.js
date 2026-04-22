const express = require('express');
const router = express.Router();
const {
  getBooks, getBook, createBook, updateBook, deleteBook,
  getCategories, addCopy, updateCopy, getBookStats, importBooks,
} = require('../controllers/bookController');
const { authenticate, isAdminOrLibrarian, isStaff } = require('../middleware/auth');
const { uploadBookCover } = require('../config/cloudinary');

router.get('/', authenticate, getBooks);
router.get('/stats', authenticate, isStaff, getBookStats);
router.get('/categories', authenticate, getCategories);
router.get('/:id', authenticate, getBook);
router.post('/', authenticate, isAdminOrLibrarian, uploadBookCover.single('coverImage'), createBook);
router.put('/:id', authenticate, isAdminOrLibrarian, uploadBookCover.single('coverImage'), updateBook);
router.delete('/:id', authenticate, isAdminOrLibrarian, deleteBook);

// Copy management
router.post('/:id/copies', authenticate, isStaff, addCopy);
router.put('/copies/:copyId', authenticate, isStaff, updateCopy);

// Bulk import (dev/admin only — secret key, no Supabase auth required)
router.post('/import/bulk', importBooks);

module.exports = router;
