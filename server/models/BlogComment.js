const mongoose = require('mongoose');

const blogCommentSchema = new mongoose.Schema({
  postSlug: { type: String, required: true, index: true },
  postTitle: { type: String, default: '' },
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  body: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('BlogComment', blogCommentSchema);
