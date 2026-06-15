const User = require('../models/User');

const TIER_THRESHOLDS = { Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000 };
const POINTS_PER_RUPEE = 0.1; // 1 point per ₹10 spent
const POINTS_TO_RUPEE  = 0.5; // 1 point = ₹0.50 off (200 points = ₹100)

function calcTier(totalEarned) {
  if (totalEarned >= TIER_THRESHOLDS.Platinum) return 'Platinum';
  if (totalEarned >= TIER_THRESHOLDS.Gold)     return 'Gold';
  if (totalEarned >= TIER_THRESHOLDS.Silver)   return 'Silver';
  return 'Bronze';
}

const getMyLoyalty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loyalty name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      points: user.loyalty?.points || 0,
      totalEarned: user.loyalty?.totalEarned || 0,
      tier: user.loyalty?.tier || 'Bronze',
      history: (user.loyalty?.history || []).slice(-30).reverse(),
      tierThresholds: TIER_THRESHOLDS,
      pointsToRupee: POINTS_TO_RUPEE,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const earnPoints = async (userId, orderId, orderTotal) => {
  try {
    const pts = Math.floor(orderTotal * POINTS_PER_RUPEE);
    if (pts <= 0) return;
    const user = await User.findById(userId);
    if (!user) return;
    user.loyalty = user.loyalty || {};
    user.loyalty.points = (user.loyalty.points || 0) + pts;
    user.loyalty.totalEarned = (user.loyalty.totalEarned || 0) + pts;
    user.loyalty.tier = calcTier(user.loyalty.totalEarned);
    user.loyalty.history = user.loyalty.history || [];
    user.loyalty.history.push({ type: 'earned', points: pts, reason: `Order #${String(orderId).slice(-8).toUpperCase()}`, orderId });
    await user.save();
  } catch {}
};

const redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const available = user.loyalty?.points || 0;
    if (points > available) return res.status(400).json({ message: 'Insufficient points' });
    const discount = Math.round(points * POINTS_TO_RUPEE * 100) / 100;
    res.json({ discount, pointsUsed: points, remaining: available - points });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const applyRedemption = async (userId, orderId, pointsUsed) => {
  try {
    if (!pointsUsed || pointsUsed <= 0) return;
    const user = await User.findById(userId);
    if (!user) return;
    user.loyalty.points = Math.max(0, (user.loyalty.points || 0) - pointsUsed);
    user.loyalty.history = user.loyalty.history || [];
    user.loyalty.history.push({ type: 'redeemed', points: -pointsUsed, reason: `Redeemed on order #${String(orderId).slice(-8).toUpperCase()}`, orderId });
    await user.save();
  } catch {}
};

const getAllLoyalty = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('name email loyalty createdAt').sort({ 'loyalty.points': -1 });
    res.json(users.map(u => ({
      _id: u._id, name: u.name, email: u.email,
      points: u.loyalty?.points || 0,
      totalEarned: u.loyalty?.totalEarned || 0,
      tier: u.loyalty?.tier || 'Bronze',
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adjustPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    if (!userId || points == null) return res.status(400).json({ message: 'userId and points required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.loyalty = user.loyalty || {};
    user.loyalty.points = Math.max(0, (user.loyalty.points || 0) + points);
    if (points > 0) user.loyalty.totalEarned = (user.loyalty.totalEarned || 0) + points;
    user.loyalty.tier = calcTier(user.loyalty.totalEarned || 0);
    user.loyalty.history = user.loyalty.history || [];
    user.loyalty.history.push({ type: points > 0 ? 'earned' : 'redeemed', points, reason: reason || 'Admin adjustment' });
    await user.save();
    res.json({ points: user.loyalty.points, tier: user.loyalty.tier });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyLoyalty, earnPoints, redeemPoints, applyRedemption, getAllLoyalty, adjustPoints };
