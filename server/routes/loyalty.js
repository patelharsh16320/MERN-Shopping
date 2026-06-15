const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getMyLoyalty, redeemPoints, getAllLoyalty, adjustPoints } = require('../controllers/loyaltyController');

router.get('/me',        protect, getMyLoyalty);
router.post('/redeem',   protect, redeemPoints);
router.get('/all',       protect, admin, getAllLoyalty);
router.post('/adjust',   protect, admin, adjustPoints);

module.exports = router;
