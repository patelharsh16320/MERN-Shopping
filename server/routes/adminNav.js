const express = require('express');
const router = express.Router();
const AdminNavItem = require('../models/AdminNavItem');
const { protect, admin } = require('../middleware/auth');

const DEFAULTS = [
  { key: 'dashboard',         label: 'Dashboard',          icon: '📊' },
  { key: 'products',          label: 'Products',           icon: '🌸' },
  { key: 'categories',        label: 'Categories',         icon: '🏷️' },
  { key: 'users',             label: 'Users',               icon: '👥' },
  { key: 'orders',            label: 'Orders',              icon: '📦' },
  { key: 'invoices',          label: 'Invoices',            icon: '🧾' },
  { key: 'analytics',         label: 'Analytics',           icon: '📈' },
  { key: 'messages',          label: 'Messages',            icon: '💬' },
  { key: 'reviews',           label: 'Reviews',             icon: '⭐' },
  { key: 'coupons',           label: 'Coupons',             icon: '🎟️' },
  { key: 'secureData',        label: 'Secure Data',         icon: '🔐' },
  { key: 'importExport',      label: 'Import / Export',     icon: '📂' },
  { key: 'whatsNew',          label: "What's New",          icon: '✨' },
  { key: 'streakBoard',       label: 'Streak Board',        icon: '🔥' },
  { key: 'support',           label: 'Support',             icon: '🎧' },
  { key: 'pages',             label: 'Pages',                icon: '🔘' },
  { key: 'dashboardSettings', label: 'Dashboard Settings',  icon: '🧩' },
  { key: 'pageSpeed',         label: 'Page Speed',          icon: '⚡' },
].map(d => ({ ...d, isActive: true }));

async function ensureDefaults() {
  const count = await AdminNavItem.countDocuments();
  if (count === 0) await AdminNavItem.insertMany(DEFAULTS);
}

// GET /api/admin-nav — admin only (used by the admin sidebar itself)
router.get('/', protect, admin, async (req, res) => {
  try {
    await ensureDefaults();
    const items = await AdminNavItem.find().sort('createdAt');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin-nav/:key — admin only
router.put('/:key', protect, admin, async (req, res) => {
  try {
    if (req.params.key === 'dashboard') {
      return res.status(400).json({ message: 'The Dashboard menu item cannot be hidden' });
    }
    const { isActive } = req.body;
    const item = await AdminNavItem.findOneAndUpdate(
      { key: req.params.key },
      { isActive },
      { new: true, upsert: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
