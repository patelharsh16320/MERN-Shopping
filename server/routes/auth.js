const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, toggleWishlist, getCards, saveCard, deleteCard, getStreak, checkIn } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/wishlist/:productId', protect, toggleWishlist);
router.get('/cards', protect, getCards);
router.post('/cards', protect, saveCard);
router.delete('/cards/:cardId', protect, deleteCard);
router.get('/streak', protect, getStreak);
router.post('/streak/checkin', protect, checkIn);

module.exports = router;
