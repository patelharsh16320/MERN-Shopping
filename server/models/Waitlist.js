const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  email:    { type: String, required: true, trim: true, lowercase: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

waitlistSchema.index({ product: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
