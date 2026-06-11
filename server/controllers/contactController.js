const Contact = require('../models/Contact');

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'All fields are required' });
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ message: 'Message received', contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const query = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      query.$or = [{ name: re }, { email: re }, { subject: re }, { message: re }];
    }
    if (req.query.isRead !== undefined) query.isRead = req.query.isRead === 'true';
    const total    = await Contact.countDocuments(query);
    const contacts = await Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ contacts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: req.body.isRead !== undefined ? req.body.isRead : true },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitContact, getContacts, markRead, deleteContact };
