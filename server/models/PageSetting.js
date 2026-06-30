const mongoose = require('mongoose');

const pageSettingSchema = new mongoose.Schema({
  key:             { type: String, required: true, unique: true },
  label:           { type: String, required: true },
  icon:            { type: String, default: '📄' },
  isActive:        { type: Boolean, default: true },
  metaTitle:       { type: String, default: '' },
  metaDescription: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PageSetting', pageSettingSchema);
