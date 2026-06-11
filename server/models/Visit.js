const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  page: { type: String, default: '/' },
  ip: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
