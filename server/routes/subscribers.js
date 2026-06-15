const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { subscribe, getAll, deleteSubscriber } = require('../controllers/subscriberController');

router.post('/', subscribe);
router.get('/', protect, admin, getAll);
router.delete('/:id', protect, admin, deleteSubscriber);

module.exports = router;
