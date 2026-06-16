const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType:  { type: String, enum: ['percentage', 'fixed', 'set_price'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxUsage:      { type: Number, default: 0 },
  usageCount:    { type: Number, default: 0 },
  expiresAt:     { type: Date, default: null },
  isActive:      { type: Boolean, default: true },
  archiveStatus: { type: String, enum: ['active', 'draft', 'trash'], default: 'active' },
  draftedAt:     { type: Date, default: null },
  trashedAt:     { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
