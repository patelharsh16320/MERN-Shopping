const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({ message: { type: String, required: true } }, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false },
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
