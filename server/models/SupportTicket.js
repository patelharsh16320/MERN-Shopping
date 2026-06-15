const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:     { type: String, enum: ['user', 'admin'], required: true },
  senderName: { type: String, default: '' },
  text:       { type: String, required: true },
}, { timestamps: true });

const supportSchema = new mongoose.Schema({
  ticketId:   { type: String, unique: true, sparse: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:       { type: String, required: true },
  email:      { type: String, required: true },
  subject:    { type: String, required: true },
  category:   { type: String, enum: ['Order Issue', 'Payment', 'Shipping', 'Product', 'Technical', 'Account', 'Other'], default: 'Other' },
  priority:   { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:     { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  messages:   [messageSchema],
  adminUnread: { type: Boolean, default: true },
  userUnread:  { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate a short ticketId before save
supportSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await this.constructor.countDocuments();
    const num   = String(count + 1).padStart(5, '0');
    this.ticketId = `TKT-${new Date().getFullYear()}-${num}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportSchema);
