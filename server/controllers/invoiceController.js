const Invoice = require('../models/Invoice');

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).populate('order', 'orderStatus createdAt').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order').populate('user', 'name email phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoiceByOrder = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ order: req.params.orderId }).populate('order').populate('user', 'name email phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const query = status ? { status } : {};
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query).populate('user', 'name email').populate('order', 'orderStatus').sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ invoices, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyInvoices, getInvoiceById, getInvoiceByOrder, getAllInvoices, updateInvoice, deleteInvoice };
