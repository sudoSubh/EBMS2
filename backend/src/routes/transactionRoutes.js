const express = require('express');
const router = express.Router();
const {
  issueBook, returnBook, renewBook, getTransactions,
  getTransaction, getOverdueTransactions,
} = require('../controllers/transactionController');
const { authenticate, isStaff } = require('../middleware/auth');

router.get('/', authenticate, getTransactions);
router.get('/overdue', authenticate, isStaff, getOverdueTransactions);
router.get('/:id', authenticate, getTransaction);
router.post('/issue', authenticate, isStaff, issueBook);
router.post('/return', authenticate, isStaff, returnBook);
router.post('/renew', authenticate, renewBook);

module.exports = router;
