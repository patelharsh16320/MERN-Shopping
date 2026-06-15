const mongoose = require('mongoose');

const userAddressSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label:     { type: String, default: 'Home' },
  street:    { type: String, default: '' },
  city:      { type: String, default: '' },
  state:     { type: String, default: '' },
  zip:       { type: String, default: '' },
  country:   { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('UserAddress', userAddressSchema);
