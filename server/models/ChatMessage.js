const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  room:        { type: String, required: true },   // userId of the user (chat session key)
  sender:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:  { type: String, enum: ['user', 'admin'], required: true },
  senderName:  { type: String, default: '' },
  message:     { type: String, required: true, trim: true },
  read:        { type: Boolean, default: false },
}, { timestamps: true });

chatMessageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
