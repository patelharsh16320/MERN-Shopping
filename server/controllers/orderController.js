const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

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

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getOrderStats };
