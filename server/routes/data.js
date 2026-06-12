const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const { exportData, importData } = require('../controllers/dataController');

router.get('/export',  protect, admin, exportData);
router.post('/import', protect, admin, importData);

module.exports = router;
