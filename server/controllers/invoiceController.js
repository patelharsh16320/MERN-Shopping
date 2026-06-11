const Invoice = require('../models/Invoice');
const User = require('../models/User');

const toCSV = (rows, fields) => {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

const genInvoiceNum = () => 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

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

const exportInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('user', 'name email').sort({ createdAt: -1 });
    const data = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      userEmail: inv.user?.email || '',
      userName: inv.user?.name || '',
      status: inv.status,
      subtotal: inv.subtotal,
      tax: inv.tax,
      shipping: inv.shipping,
      total: inv.total,
      paymentMethod: inv.paymentMethod,
      items: JSON.stringify(inv.items?.map(i => ({ name: i.name, qty: i.quantity, price: i.price })) || []),
      createdAt: inv.createdAt?.toISOString().slice(0, 10),
    }));
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(toCSV(data, ['invoiceNumber', 'userEmail', 'userName', 'status', 'total', 'paymentMethod', 'items', 'createdAt']));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importInvoices = async (req, res) => {
  try {
    const { items, duplicateAction } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const numbers = items.map(i => i.invoiceNumber?.trim()).filter(Boolean);
    const existing = numbers.length ? await Invoice.find({ invoiceNumber: { $in: numbers } }) : [];
    const existingNums = new Set(existing.map(inv => inv.invoiceNumber));

    let removed = 0, imported = 0, skipped = 0;

    if (duplicateAction === 'remove' && existing.length) {
      await Invoice.deleteMany({ _id: { $in: existing.map(inv => inv._id) } });
      removed = existing.length;
    }

    for (const item of items) {
      const invNum = item.invoiceNumber?.trim();
      if (duplicateAction === 'ignore' && invNum && existingNums.has(invNum)) { skipped++; continue; }
      try {
        let userId = null;
        if (item.userEmail) {
          const user = await User.findOne({ email: item.userEmail.trim().toLowerCase() });
          if (user) userId = user._id;
        }
        let invItems = [];
        try {
          invItems = typeof item.items === 'string' ? JSON.parse(item.items) : (Array.isArray(item.items) ? item.items : []);
          invItems = invItems.map(i => ({ name: i.name || '', quantity: Number(i.qty || i.quantity) || 1, price: Number(i.price) || 0, total: Number(i.price) * (Number(i.qty || i.quantity) || 1) }));
        } catch { invItems = []; }
        await Invoice.create({
          invoiceNumber: invNum || genInvoiceNum(),
          user: userId,
          status: item.status || 'Draft',
          subtotal: Number(item.subtotal) || 0,
          tax: Number(item.tax) || 0,
          shipping: Number(item.shipping) || 0,
          total: Number(item.total) || 0,
          paymentMethod: item.paymentMethod || 'COD',
          items: invItems,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          billingAddress: { name: item.userName || '', email: item.userEmail || '' },
        });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, removed, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyInvoices, getInvoiceById, getInvoiceByOrder, getAllInvoices, updateInvoice, deleteInvoice, exportInvoices, importInvoices };
