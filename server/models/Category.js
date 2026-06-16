const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏷️' },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  archiveStatus: { type: String, enum: ['active', 'draft', 'trash'], default: 'active' },
  draftedAt: { type: Date, default: null },
  trashedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
