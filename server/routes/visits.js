const express = require('express');
const router = express.Router();
const { recordVisit, getStats } = require('../controllers/visitController');
const { protect, admin } = require('../middleware/auth');

router.post('/', recordVisit);
router.get('/stats', protect, admin, getStats);

module.exports = router;
