const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const savedCardSchema = new mongoose.Schema({
  type: { type: String, required: true },
  last4: { type: String, default: '' },
  cardHolder: { type: String, default: '' },
  expiry: { type: String, default: '' },
  upiId: { type: String, default: '' },
  bankName: { type: String, default: '' },
  isDefault: { type: Boolean, default: false }
});

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  addresses: [addressSchema],
  isActive: { type: Boolean, default: true },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  savedCards: [savedCardSchema],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastCheckIn: { type: Date, default: null },
    rewardsClaimed: [{ type: Number }],
    earnedCoupons: [{
      code:          { type: String },
      discountValue: { type: Number },
      expiresAt:     { type: Date },
      milestone:     { type: Number },
      earnedAt:      { type: Date, default: Date.now },
    }],
  },
  loyalty: {
    points:     { type: Number, default: 0 },
    totalEarned:{ type: Number, default: 0 },
    tier:       { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    history: [{
      type:      { type: String, enum: ['earned', 'redeemed'] },
      points:    { type: Number },
      reason:    { type: String },
      orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      date:      { type: Date, default: Date.now },
    }],
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
