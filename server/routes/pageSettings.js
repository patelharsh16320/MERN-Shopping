const express = require('express');
const router = express.Router();
const PageSetting = require('../models/PageSetting');
const { protect, admin } = require('../middleware/auth');

const DEFAULTS = [
  { key: 'home',     label: 'Home',           icon: '🏠', isActive: true },
  { key: 'products', label: 'Shop / Products', icon: '🌸', isActive: true },
  { key: 'offers',   label: 'Special Offers',  icon: '🔥', isActive: true },
  { key: 'quiz',     label: 'Beauty Quiz',     icon: '✨', isActive: true },
  { key: 'about',    label: 'About Us',        icon: 'ℹ️',  isActive: true },
  { key: 'contact',  label: 'Contact Us',      icon: '📩', isActive: true },
  { key: 'support',  label: 'Support',         icon: '🎧', isActive: true },
  { key: 'wishlist', label: 'Wishlist',        icon: '❤️',  isActive: true },
];

// Seed defaults if collection is empty
async function ensureDefaults() {
  const count = await PageSetting.countDocuments();
  if (count === 0) {
    await PageSetting.insertMany(DEFAULTS);
  }
}

// GET /api/page-settings — public (used by client to know which pages are visible)
router.get('/', async (req, res) => {
  try {
    await ensureDefaults();
    const settings = await PageSetting.find().sort('key');
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/page-settings/:key — admin only
router.put('/:key', protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const setting = await PageSetting.findOneAndUpdate(
      { key: req.params.key },
      { isActive },
      { new: true, upsert: true }
    );
    // Broadcast change to all connected clients
    const io = req.app.get('io');
    if (io) io.to('public_room').emit('page_settings_updated', { key: setting.key, isActive: setting.isActive });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
