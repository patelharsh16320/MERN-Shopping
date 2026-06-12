const Changelog = require('../models/Changelog');

const getAll = async (req, res) => {
  try {
    const entries = await Changelog.find().sort({ order: 1, createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const entry = new Changelog(req.body);
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const entry = await Changelog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const entry = await Changelog.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bulkCreate = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ message: 'entries must be an array' });
    const created = await Changelog.insertMany(entries);
    res.status(201).json({ inserted: created.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getAll, create, update, remove, bulkCreate };
