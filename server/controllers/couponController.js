const Coupon = require('../models/Coupon');

const getAll = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUsage, expiresAt, isActive } = req.body;
    if (!code || !discountType || discountValue == null) return res.status(400).json({ message: 'Code, type, and value are required' });
    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists) return res.status(400).json({ message: 'Coupon code already exists' });
    const coupon = await Coupon.create({ code, discountType, discountValue, minOrderAmount, maxUsage, expiresAt: expiresAt || null, isActive });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const validate = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon code' });

    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (orderTotal < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });

    let discount = coupon.discountType === 'percentage'
      ? Math.min((orderTotal * coupon.discountValue) / 100, orderTotal)
      : Math.min(coupon.discountValue, orderTotal);

    discount = Math.round(discount * 100) / 100;

    res.json({ valid: true, coupon: { _id: coupon._id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }, discount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const applyUsage = async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
    res.json({ message: 'Usage recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove, validate, applyUsage };
