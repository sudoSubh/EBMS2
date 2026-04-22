const express = require('express');
const router = express.Router();
const { getFines, payFine, waiveFine, getFineStats } = require('../controllers/fineController');
const { authenticate, isStaff, isAdminOrLibrarian } = require('../middleware/auth');

router.get('/', authenticate, getFines);
router.get('/stats', authenticate, isStaff, getFineStats);
router.post('/:id/pay', authenticate, isStaff, payFine);
router.post('/:id/waive', authenticate, isAdminOrLibrarian, waiveFine);

module.exports = router;
