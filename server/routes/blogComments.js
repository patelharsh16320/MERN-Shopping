const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { submit, getForPost, getAll, getStats, updateStatus, remove, bulkUpdate, bulkDelete } = require('../controllers/blogCommentController');

router.post('/', protect, submit);
router.get('/post/:slug', getForPost);
router.get('/stats', protect, admin, getStats);
router.get('/', protect, admin, getAll);
router.put('/bulk-status', protect, admin, bulkUpdate);
router.delete('/bulk-delete', protect, admin, bulkDelete);
router.put('/:id', protect, admin, updateStatus);
router.delete('/:id', protect, admin, remove);

module.exports = router;
