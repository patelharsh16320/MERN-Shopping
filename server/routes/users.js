const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getStats } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);
router.get('/stats', protect, admin, getStats);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
