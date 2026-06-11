const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      avatar: user.avatar, phone: user.phone, address: user.address,
      addresses: user.addresses, wishlist: user.wishlist,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('wishlist', 'name price images slug');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    if (req.body.address) user.address = req.body.address;
    if (req.body.addresses) user.addresses = req.body.addresses;
    if (req.body.password) user.password = req.body.password;
    const updated = await user.save();
    res.json({
      _id: updated._id, name: updated.name, email: updated.email,
      role: updated.role, phone: updated.phone, address: updated.address,
      addresses: updated.addresses, wishlist: updated.wishlist,
      token: generateToken(updated._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.json({ wishlist: user.wishlist, added: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedCards');
    res.json(user.savedCards || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const saveCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { type, last4, cardHolder, expiry, upiId, bankName } = req.body;
    user.savedCards.push({ type, last4, cardHolder, expiry, upiId, bankName });
    await user.save();
    res.status(201).json(user.savedCards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedCards = user.savedCards.filter(c => c._id.toString() !== req.params.cardId);
    await user.save();
    res.json({ message: 'Card removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, toggleWishlist, getCards, saveCard, deleteCard };
