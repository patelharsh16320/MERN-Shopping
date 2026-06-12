const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createTicket, getMyTickets, getTicket, userSendMessage,
  getAllTickets, adminReply, updateStatus, adminMarkSeen, getStats,
} = require('../controllers/supportController');

// Static paths first to avoid /:id conflicts
router.get('/stats',       protect, admin, getStats);
router.get('/mine',        protect, getMyTickets);
router.get('/mine/:id',    protect, getTicket);
router.get('/',            protect, admin, getAllTickets);

router.post('/',           createTicket);                    // auth optional (guests)
router.post('/:id/message', protect, userSendMessage);

router.post('/:id/reply',  protect, admin, adminReply);
router.put('/:id/status',  protect, admin, updateStatus);
router.put('/:id/seen',    protect, admin, adminMarkSeen);

module.exports = router;
