const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  summary: {
    total: Number,
    today: Number,
    thisMonth: Number,
    thisYear: Number,
    loggedIn: Number,
    anonymous: Number,
  },
  daily: [{ date: String, total: Number, unique: Number }],
  monthly: [{ month: String, total: Number, unique: Number }],
  yearly: [{ year: Number, total: Number, unique: Number }],
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
