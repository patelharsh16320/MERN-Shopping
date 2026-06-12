const mongoose = require('mongoose');

const changelogSchema = new mongoose.Schema({
  icon: { type: String, default: '✨' },
  tag: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  before: {
    label: { type: String, default: '' },
    code: { type: String, default: '' },
    points: [{ type: String }],
  },
  after: {
    label: { type: String, default: '' },
    code: { type: String, default: '' },
    points: [{ type: String }],
  },
  date: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Changelog', changelogSchema);
