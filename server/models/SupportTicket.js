const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  text:   { type: String, required: true },
}, { timestamps: true });

const supportSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  subject:     { type: String, required: true },
  status:      { type: String, enum: ['open', 'closed'], default: 'open' },
  messages:    [messageSchema],
  adminUnread: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportSchema);
