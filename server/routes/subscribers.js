const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { subscribe, getAll, deleteSubscriber, exportSubscribers } = require('../controllers/subscriberController');

router.post('/', subscribe);
router.get('/', protect, admin, getAll);
router.get('/export', protect, admin, exportSubscribers);
router.delete('/:id', protect, admin, deleteSubscriber);

module.exports = router;
