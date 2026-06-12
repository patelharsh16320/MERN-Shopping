const SupportTicket = require('../models/SupportTicket');

const createTicket = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'All fields required' });
    const ticket = await SupportTicket.create({
      user: req.user?._id || null,
      name, email, subject,
      messages: [{ sender: 'user', text: message }],
    });
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ email: req.user.email }).sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, email: req.user.email });
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const userSendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' });
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, email: req.user.email },
      { $push: { messages: { sender: 'user', text: text.trim() } }, adminUnread: true, status: 'open' },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllTickets = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adminReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Reply required' });
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { sender: 'admin', text: text.trim() } }, adminUnread: false },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStatus = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adminMarkSeen = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { adminUnread: false }, { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getStats = async (req, res) => {
  try {
    const unread = await SupportTicket.countDocuments({ adminUnread: true });
    res.json({ unread });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  createTicket, getMyTickets, getTicket, userSendMessage,
  getAllTickets, adminReply, updateStatus, adminMarkSeen, getStats,
};
