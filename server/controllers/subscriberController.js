const Subscriber = require('../models/Subscriber');

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.json({ message: 'Already subscribed' });
    await Subscriber.create({ email });
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json({ subscribers, total: subscribers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSubscriber = async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { subscribe, getAll, deleteSubscriber };
