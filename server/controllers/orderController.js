const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const XLSX = require('xlsx');
const emailService = require('../utils/emailService');

const toCSV = (rows, fields) => {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

const generateInvoiceNumber = () => {
  return 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice, isPaid, paymentResult } = req.body;
    if (!orderItems || orderItems.length === 0) return res.status(400).json({ message: 'No order items' });

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: isPaid || false,
      paidAt: isPaid ? Date.now() : undefined,
      paymentResult: paymentResult || undefined
    });
    const savedOrder = await order.save();

    // Update stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Auto-generate invoice
    const invoice = new Invoice({
      invoiceNumber: generateInvoiceNumber(),
      order: savedOrder._id,
      user: req.user._id,
      items: orderItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, total: i.price * i.quantity })),
      subtotal: itemsPrice,
      tax: taxPrice,
      shipping: shippingPrice,
      total: totalPrice,
      paymentMethod,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      billingAddress: {
        name: req.user.name,
        email: req.user.email,
        ...shippingAddress
      }
    });
    await invoice.save();

    // Send confirmation emails (non-blocking)
    const customer = await User.findById(req.user._id).lean();
    if (customer) {
      emailService.send({
        to: customer.email,
        subject: `Order Confirmed — #${String(savedOrder._id).slice(-8).toUpperCase()}`,
        html: emailService.orderConfirmationHtml(savedOrder, customer),
      });
      if (process.env.ADMIN_EMAIL) {
        emailService.send({
          to: process.env.ADMIN_EMAIL,
          subject: `New Order from ${customer.name} — ₹${savedOrder.totalPrice}`,
          html: emailService.adminNewOrderHtml(savedOrder, customer),
        });
      }
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('orderItems.product', 'name images');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('orderItems.product', 'name images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const query = status ? { orderStatus: status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.orderStatus = req.body.orderStatus || order.orderStatus;
    if (req.body.orderStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      // Update invoice status
      await Invoice.findOneAndUpdate({ order: order._id }, { status: 'Paid' });
    }
    if (req.body.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }
    order.trackingNumber = req.body.trackingNumber || order.trackingNumber;
    const updated = await order.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await Invoice.findOneAndDelete({ order: req.params.id });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ orderStatus: 'Pending' });
    const delivered = await Order.countDocuments({ orderStatus: 'Delivered' });
    const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
    res.json({ total, pending, delivered, revenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    const data = orders.map(o => ({
      _id: o._id.toString(),
      userEmail: o.user?.email || '',
      userName: o.user?.name || '',
      orderStatus: o.orderStatus,
      paymentMethod: o.paymentMethod,
      itemsPrice: o.itemsPrice,
      shippingPrice: o.shippingPrice,
      taxPrice: o.taxPrice,
      totalPrice: o.totalPrice,
      isPaid: o.isPaid ? 'Yes' : 'No',
      city: o.shippingAddress?.city || '',
      state: o.shippingAddress?.state || '',
      country: o.shippingAddress?.country || '',
      couponCode: o.couponCode || '',
      discountPrice: o.discountPrice || 0,
      items: o.orderItems.map(i => `${i.name} x${i.quantity}`).join('; '),
      createdAt: o.createdAt?.toISOString().slice(0, 10),
    }));

    const fields = ['_id', 'userEmail', 'userName', 'orderStatus', 'paymentMethod', 'totalPrice', 'discountPrice', 'couponCode', 'isPaid', 'city', 'state', 'items', 'createdAt'];

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(toCSV(data, fields));
    }

    if (req.query.format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data.map(r => ({
        'Order ID': r._id,
        'Customer Email': r.userEmail,
        'Customer Name': r.userName,
        'Status': r.orderStatus,
        'Payment Method': r.paymentMethod,
        'Total (₹)': r.totalPrice,
        'Discount (₹)': r.discountPrice,
        'Coupon': r.couponCode,
        'Paid': r.isPaid,
        'City': r.city,
        'State': r.state,
        'Items': r.items,
        'Date': r.createdAt,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
      return res.send(buf);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Note text is required' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.privateNotes.push({ text: text.trim(), addedBy: req.user.name || 'Admin', createdAt: new Date() });
    await order.save();
    res.json(order.privateNotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.privateNotes = order.privateNotes.filter(n => n._id.toString() !== req.params.noteId);
    await order.save();
    res.json(order.privateNotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importOrders = async (req, res) => {
  try {
    const { items, duplicateAction } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const existingIds = items.map(i => i._id).filter(Boolean);
    const existing = existingIds.length ? await Order.find({ _id: { $in: existingIds } }) : [];
    const existingIdSet = new Set(existing.map(o => o._id.toString()));

    let removed = 0, imported = 0, skipped = 0;

    if (duplicateAction === 'remove' && existing.length) {
      await Order.deleteMany({ _id: { $in: existing.map(o => o._id) } });
      removed = existing.length;
    }

    for (const item of items) {
      if (duplicateAction === 'ignore' && item._id && existingIdSet.has(item._id)) { skipped++; continue; }
      try {
        let userId = null;
        if (item.userEmail) {
          const user = await User.findOne({ email: item.userEmail.trim().toLowerCase() });
          if (user) userId = user._id;
        }
        let orderItems = [];
        try {
          orderItems = typeof item.items === 'string' ? JSON.parse(item.items) : (Array.isArray(item.items) ? item.items : []);
          orderItems = orderItems.map(i => ({ name: i.name || '', quantity: Number(i.qty || i.quantity) || 1, price: Number(i.price) || 0 }));
        } catch { orderItems = []; }
        const totalPrice = Number(item.totalPrice) || orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
        await Order.create({
          user: userId,
          orderItems,
          shippingAddress: { address: item.address || '', city: item.city || '', country: item.country || 'India' },
          paymentMethod: item.paymentMethod || 'COD',
          itemsPrice: Number(item.itemsPrice) || totalPrice,
          shippingPrice: Number(item.shippingPrice) || 0,
          taxPrice: Number(item.taxPrice) || 0,
          totalPrice,
          orderStatus: item.orderStatus || 'Pending',
          isPaid: item.isPaid === true || item.isPaid === 'true',
        });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, removed, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getOrderStats, exportOrders, importOrders, addNote, deleteNote };
