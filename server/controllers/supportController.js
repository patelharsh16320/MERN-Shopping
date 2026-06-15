const SupportTicket = require('../models/SupportTicket');

const createTicket = async (req, res) => {
  try {
    const { name, email, subject, message, category, priority } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'Name, email, subject and message are required' });
    const ticket = await SupportTicket.create({
      user:     req.user?._id || null,
      name, email, subject,
      category: category || 'Other',
      priority: priority || 'medium',
      messages: [{ sender: 'user', senderName: name, text: message }],
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
    // Mark as read by user
    if (ticket.userUnread) {
      ticket.userUnread = false;
      await ticket.save();
    }
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const userSendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' });
    const ticket = await SupportTicket.findOne({ _id: req.params.id, email: req.user.email });
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    if (ticket.status === 'closed') return res.status(400).json({ message: 'Ticket is closed' });
    ticket.messages.push({ sender: 'user', senderName: req.user.name, text: text.trim() });
    ticket.adminUnread = true;
    ticket.userUnread  = false;
    if (ticket.status === 'resolved') ticket.status = 'in-progress';
    await ticket.save();
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// User closes their own ticket
const userCloseTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, email: req.user.email },
      { status: 'closed' },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllTickets = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;
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
      {
        $push:  { messages: { sender: 'admin', senderName: 'Support Team', text: text.trim() } },
        adminUnread: false,
        userUnread:  true,
        status: 'in-progress',
      },
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

const updatePriority = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { priority: req.body.priority }, { new: true }
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
    const [unread, open, inProgress, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments({ adminUnread: true }),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in-progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
    ]);
    res.json({ unread, open, inProgress, resolved, closed, total: open + inProgress + resolved + closed });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  createTicket, getMyTickets, getTicket, userSendMessage, userCloseTicket,
  getAllTickets, adminReply, updateStatus, updatePriority, adminMarkSeen, getStats,
};
