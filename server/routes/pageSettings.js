const express = require('express');
const router = express.Router();
const PageSetting = require('../models/PageSetting');
const { protect, admin } = require('../middleware/auth');

const DEFAULTS = [
  { key: 'home',     label: 'Home',           icon: '🏠', isActive: true, metaTitle: 'Women HubClub – Home',           metaDescription: 'Discover premium beauty and wellness products at Women HubClub.' },
  { key: 'products', label: 'Shop / Products', icon: '🌸', isActive: true, metaTitle: 'Shop – Women HubClub',           metaDescription: 'Browse our full collection of beauty, skincare and wellness products.' },
  { key: 'offers',   label: 'Special Offers',  icon: '🔥', isActive: true, metaTitle: 'Special Offers – Women HubClub', metaDescription: 'Exclusive deals and flash sales on top beauty products.' },
  { key: 'quiz',     label: 'Beauty Quiz',     icon: '✨', isActive: true, metaTitle: 'Beauty Quiz – Women HubClub',    metaDescription: 'Take our beauty quiz and find the perfect products for your skin.' },
  { key: 'about',    label: 'About Us',        icon: 'ℹ️',  isActive: true, metaTitle: 'About Us – Women HubClub',      metaDescription: 'Learn about our story, mission and values at Women HubClub.' },
  { key: 'contact',  label: 'Contact Us',      icon: '📩', isActive: true, metaTitle: 'Contact Us – Women HubClub',    metaDescription: 'Get in touch with our team at Women HubClub.' },
  { key: 'support',  label: 'Support',         icon: '🎧', isActive: true, metaTitle: 'Support – Women HubClub',       metaDescription: 'Need help? Raise a support ticket and our team will assist you.' },
  { key: 'wishlist', label: 'Wishlist',        icon: '❤️',  isActive: true, metaTitle: 'My Wishlist – Women HubClub',   metaDescription: 'View and manage your saved products.' },
];

// Seed defaults and backfill any missing meta fields
async function ensureDefaults() {
  const count = await PageSetting.countDocuments();
  if (count === 0) {
    await PageSetting.insertMany(DEFAULTS);
  } else {
    // Backfill metaTitle/metaDescription on existing docs that don't have them
    for (const d of DEFAULTS) {
      await PageSetting.updateOne(
        { key: d.key, $or: [{ metaTitle: { $exists: false } }, { metaTitle: '' }] },
        { $set: { metaTitle: d.metaTitle, metaDescription: d.metaDescription } }
      );
    }
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
    const { isActive, metaTitle, metaDescription } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (metaTitle !== undefined) update.metaTitle = metaTitle;
    if (metaDescription !== undefined) update.metaDescription = metaDescription;

    const setting = await PageSetting.findOneAndUpdate(
      { key: req.params.key },
      update,
      { new: true, upsert: true }
    );
    const io = req.app.get('io');
    if (io) io.to('public_room').emit('page_settings_updated', {
      key: setting.key, isActive: setting.isActive,
      metaTitle: setting.metaTitle, metaDescription: setting.metaDescription,
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
