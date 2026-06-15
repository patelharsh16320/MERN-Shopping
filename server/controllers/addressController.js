const UserAddress = require('../models/UserAddress');

const getAddresses = async (req, res) => {
  try {
    const addresses = await UserAddress
      .find({ userId: req.params.userId })
      .sort({ isDefault: -1, createdAt: 1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAddress = async (req, res) => {
  try {
    const { label, street, city, state, zip, country, isDefault } = req.body;
    if (isDefault) {
      await UserAddress.updateMany({ userId: req.params.userId }, { isDefault: false });
    }
    const addr = await UserAddress.create({
      userId: req.params.userId, label, street, city, state, zip, country,
      isDefault: !!isDefault,
    });
    res.status(201).json(addr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const addr = await UserAddress.findById(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    if (req.body.isDefault) {
      await UserAddress.updateMany({ userId: addr.userId }, { isDefault: false });
    }
    Object.assign(addr, req.body);
    await addr.save();
    res.json(addr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addr = await UserAddress.findByIdAndDelete(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const setDefault = async (req, res) => {
  try {
    const addr = await UserAddress.findById(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    await UserAddress.updateMany({ userId: addr.userId }, { isDefault: false });
    addr.isDefault = true;
    await addr.save();
    res.json(addr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefault };
