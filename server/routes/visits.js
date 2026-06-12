const express = require('express');
const router = express.Router();
const { recordVisit, getStats, exportAnalytics, saveSnapshot, getSnapshots, deleteSnapshot } = require('../controllers/visitController');
const { protect, admin } = require('../middleware/auth');

router.post('/', recordVisit);
router.get('/stats', protect, admin, getStats);
router.get('/export', protect, admin, exportAnalytics);
router.get('/snapshots', protect, admin, getSnapshots);
router.post('/snapshots', protect, admin, saveSnapshot);
router.delete('/snapshots/:id', protect, admin, deleteSnapshot);

module.exports = router;
