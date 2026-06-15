const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// User: get own chat history
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room: req.user._id.toString() })
      .sort({ createdAt: 1 }).limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get a specific user's chat history
router.get('/history/:userId', protect, admin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room: req.params.userId })
      .sort({ createdAt: 1 }).limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all chat sessions (grouped by room, with last message + unread count)
router.get('/sessions', protect, admin, async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$read', false] }, { $eq: ['$senderRole', 'user'] }] }, 1, 0]
            }
          },
          totalMessages: { $sum: 1 },
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    const populated = await Promise.all(sessions.map(async s => {
      const user = await User.findById(s._id).select('name email');
      return { ...s, user };
    }));

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: mark all messages in a room as read
router.put('/read/:userId', protect, admin, async (req, res) => {
  try {
    await ChatMessage.updateMany(
      { room: req.params.userId, senderRole: 'user', read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get total unread count across all sessions
router.get('/unread-count', protect, admin, async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({ senderRole: 'user', read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
