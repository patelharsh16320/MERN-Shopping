const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  archiveStatus: { type: String, enum: ['active', 'draft', 'trash'], default: 'active' },
  draftedAt: { type: Date, default: null },
  trashedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
