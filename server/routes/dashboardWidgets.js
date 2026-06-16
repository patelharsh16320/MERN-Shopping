const express = require('express');
const router = express.Router();
const DashboardWidget = require('../models/DashboardWidget');
const { protect, admin } = require('../middleware/auth');

const DEFAULTS = [
  { key: 'revenueCard',     label: 'Total Revenue',          icon: '💰', isActive: true },
  { key: 'ordersCard',      label: 'Total Orders',           icon: '📦', isActive: true },
  { key: 'usersCard',       label: 'Total Users',            icon: '👥', isActive: true },
  { key: 'productsCard',    label: 'Total Products',         icon: '🌸', isActive: true },
  { key: 'pendingCard',     label: 'Pending Orders',         icon: '⏳', isActive: true },
  { key: 'deliveredCard',   label: 'Delivered',              icon: '✅', isActive: true },
  { key: 'recentOrders',    label: 'Recent Orders',          icon: '📋', isActive: true },
  { key: 'contactMessages', label: 'Contact Messages',       icon: '📩', isActive: true },
  { key: 'subscribers',     label: 'Inner Circle Subscribers', icon: '💌', isActive: true },
];

async function ensureDefaults() {
  const count = await DashboardWidget.countDocuments();
  if (count === 0) await DashboardWidget.insertMany(DEFAULTS);
}

// GET /api/dashboard-widgets — admin only (used by the admin Dashboard itself)
router.get('/', protect, admin, async (req, res) => {
  try {
    await ensureDefaults();
    const widgets = await DashboardWidget.find().sort('createdAt');
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/dashboard-widgets/:key — admin only
router.put('/:key', protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const widget = await DashboardWidget.findOneAndUpdate(
      { key: req.params.key },
      { isActive },
      { new: true, upsert: true }
    );
    res.json(widget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
