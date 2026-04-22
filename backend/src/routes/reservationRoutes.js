const express = require('express');
const router = express.Router();
const { reserveBook, cancelReservation, getReservations } = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getReservations);
router.post('/', authenticate, reserveBook);
router.delete('/:id', authenticate, cancelReservation);

module.exports = router;
