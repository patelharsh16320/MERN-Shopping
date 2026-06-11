const express = require('express');
const router = express.Router();
const { recordVisit, getStats, exportAnalytics } = require('../controllers/visitController');
const { protect, admin } = require('../middleware/auth');

router.post('/', recordVisit);
router.get('/stats', protect, admin, getStats);
router.get('/export', protect, admin, exportAnalytics);

module.exports = router;
