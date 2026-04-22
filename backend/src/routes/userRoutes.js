const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, createUser, updateUser, deleteUser,
  getUserHistory, getUserStats,
} = require('../controllers/userController');
const { authenticate, isAdmin, isStaff } = require('../middleware/auth');

router.get('/', authenticate, isStaff, getUsers);
router.get('/stats', authenticate, isStaff, getUserStats);
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, isAdmin, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, isAdmin, deleteUser);
router.get('/:id/history', authenticate, getUserHistory);

module.exports = router;
