const Product  = require('../models/Product');
const Category = require('../models/Category');
const User     = require('../models/User');
const Order    = require('../models/Order');
const Invoice  = require('../models/Invoice');
const Visit    = require('../models/Visit');
const Contact  = require('../models/Contact');

const TYPES = ['products', 'categories', 'users', 'orders', 'invoices', 'analytics', 'contacts', 'reviews'];

const CSV_FIELDS = {
  products:   ['name','description','price','originalPrice','discount','category','subcategory','images','stock','totalStock','rating','numReviews','brand','tags','isActive','isFeatured','weight','freshnessDays','status'],
  categories: ['name','icon','description','isActive','isDefault','parent'],
  users:      ['name','email','phone','role','isActive','createdAt'],
  orders:     ['_id','userEmail','totalPrice','orderStatus','paymentMethod','isPaid','trackingNumber','items','createdAt'],
  invoices:   ['invoiceNumber','status','total','subtotal','tax','shipping','paymentMethod','createdAt'],
  contacts:   ['name','email','subject','message','isRead','createdAt'],
  reviews:    ['productName','reviewerName','rating','comment','isApproved','createdAt'],
};

const toCSV = (rows, fields) => {
  const esc = v => { const s = v == null ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

async function getData(type, csvMode = false) {
  switch (type) {
    case 'products': {
      const rows = await Product.find().lean();
      return rows.map(p => ({
        name: p.name, description: p.description, price: p.price,
        originalPrice: p.originalPrice, discount: p.discount,
        category: p.category, subcategory: p.subcategory || '',
        images: csvMode ? (p.images || []).join(';') : p.images,
        stock: p.stock, totalStock: p.totalStock,
        rating: p.rating, numReviews: p.numReviews, brand: p.brand,
        tags: csvMode ? (p.tags || []).join(';') : p.tags,
        isActive: p.isActive, isFeatured: p.isFeatured,
        weight: p.weight, freshnessDays: p.freshnessDays, status: p.status || 'published',
      }));
    }
    case 'categories': {
      const rows = await Category.find().populate('parent', 'name').lean();
      return rows.map(c => ({
        name: c.name, icon: c.icon || '🏷️', description: c.description,
        isActive: c.isActive, isDefault: c.isDefault, parent: c.parent?.name || '',
      }));
    }
    case 'users': {
      const rows = await User.find().select('-password').lean();
      return rows.map(u => ({
        name: u.name, email: u.email, phone: u.phone || '',
        role: u.role, isActive: u.isActive, createdAt: u.createdAt,
      }));
    }
    case 'orders': {
      const rows = await Order.find().populate('user', 'email').lean();
      return rows.map(o => ({
        _id: String(o._id), userEmail: o.user?.email || '',
        totalPrice: o.totalPrice, orderStatus: o.orderStatus,
        paymentMethod: o.paymentMethod, isPaid: o.isPaid,
        trackingNumber: o.trackingNumber || '',
        items: csvMode ? JSON.stringify(o.orderItems || []) : (o.orderItems || []),
        createdAt: o.createdAt,
      }));
    }
    case 'invoices': {
      const rows = await Invoice.find().lean();
      return rows.map(i => ({
        invoiceNumber: i.invoiceNumber, status: i.status,
        total: i.total, subtotal: i.subtotal, tax: i.tax, shipping: i.shipping,
        paymentMethod: i.paymentMethod, createdAt: i.createdAt,
      }));
    }
    case 'analytics': {
      const visits = await Visit.find().lean();
      const daily = {}, monthly = {}, yearly = {};
      visits.forEach(v => {
        const d = new Date(v.createdAt);
        const day   = d.toISOString().slice(0, 10);
        const month = d.toISOString().slice(0, 7);
        const year  = String(d.getFullYear());
        daily[day]     = (daily[day]   || 0) + 1;
        monthly[month] = (monthly[month] || 0) + 1;
        yearly[year]   = (yearly[year] || 0) + 1;
      });
      return { total: visits.length, daily, monthly, yearly };
    }
    case 'contacts': {
      const rows = await Contact.find().lean();
      return rows.map(c => ({
        name: c.name, email: c.email, subject: c.subject,
        message: c.message, isRead: c.isRead, createdAt: c.createdAt,
      }));
    }
    case 'reviews': {
      const products = await Product.find({ 'reviews.0': { $exists: true } }).select('name reviews').lean();
      const out = [];
      for (const p of products) {
        for (const r of p.reviews) {
          out.push({
            productName: p.name, reviewerName: r.name,
            rating: r.rating, comment: r.comment,
            isApproved: r.isApproved !== false, createdAt: r.createdAt,
          });
        }
      }
      return out;
    }
    default:
      return null;
  }
}

// GET /api/data/export?type=all|products|..&format=json|csv
const exportData = async (req, res) => {
  const { type = 'all', format = 'json' } = req.query;
  try {
    if (type === 'all') {
      const bundle = { exportedAt: new Date().toISOString(), version: '1.0' };
      for (const t of TYPES) bundle[t] = await getData(t, false);
      return res.json(bundle);
    }

    if (!TYPES.includes(type)) return res.status(400).json({ message: 'Unknown type' });

    const data = await getData(type, format === 'csv');

    if (type === 'analytics' || format !== 'csv') return res.json(data);

    const fields = CSV_FIELDS[type] || [];
    res.setHeader('Content-Type', 'text/csv');
    return res.send(toCSV(data, fields));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/data/import  body: { bundle, duplicateAction }
const importData = async (req, res) => {
  const { bundle, duplicateAction = 'ignore' } = req.body;
  if (!bundle || typeof bundle !== 'object') return res.status(400).json({ message: 'No bundle data provided' });

  const results = {};

  // --- products ---
  if (Array.isArray(bundle.products)) {
    const items = bundle.products;
    const names = items.map(i => i.name?.trim()).filter(Boolean);
    const existing = await Product.find({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
    const existingNamesLower = existing.map(p => p.name.toLowerCase());
    let imported = 0, skipped = 0;
    if (duplicateAction === 'remove' && existing.length) {
      await Product.deleteMany({ _id: { $in: existing.map(p => p._id) } });
    }
    for (const item of items) {
      if (!item.name?.trim()) continue;
      if (duplicateAction === 'ignore' && existingNamesLower.includes(item.name.trim().toLowerCase())) { skipped++; continue; }
      try {
        const stock = Number(item.stock) || 0;
        await Product.create({
          name: item.name.trim(), description: item.description || '',
          price: Number(item.price) || 0, originalPrice: Number(item.originalPrice) || 0,
          discount: Number(item.discount) || 0, category: item.category || 'General',
          subcategory: item.subcategory || '',
          images: Array.isArray(item.images) ? item.images : (item.images || '').split(';').filter(Boolean),
          stock, totalStock: Number(item.totalStock) || stock,
          rating: Number(item.rating) || 0, numReviews: Number(item.numReviews) || 0,
          brand: item.brand || 'Women HubClub',
          tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(';').filter(Boolean),
          isActive: item.isActive !== false, isFeatured: !!item.isFeatured,
          weight: item.weight || '200g', freshnessDays: Number(item.freshnessDays) || 365,
          status: item.status || 'published',
        });
        imported++;
      } catch { skipped++; }
    }
    results.products = { imported, skipped };
  }

  // --- categories ---
  if (Array.isArray(bundle.categories)) {
    const items = bundle.categories;
    let imported = 0, skipped = 0;
    for (const item of items) {
      if (!item.name?.trim() || item.isDefault) continue;
      try {
        const exists = await Category.findOne({ name: new RegExp(`^${item.name.trim()}$`, 'i') });
        if (exists) {
          if (duplicateAction === 'remove') await Category.deleteOne({ _id: exists._id });
          else { skipped++; continue; }
        }
        await Category.create({
          name: item.name.trim(), icon: item.icon || '🏷️',
          description: item.description || '', isActive: item.isActive !== false,
        });
        imported++;
      } catch { skipped++; }
    }
    results.categories = { imported, skipped };
  }

  // --- users ---
  if (Array.isArray(bundle.users)) {
    const items = bundle.users;
    let imported = 0, skipped = 0;
    for (const item of items) {
      if (!item.email?.trim() || item.role === 'admin') continue;
      try {
        const exists = await User.findOne({ email: item.email.trim().toLowerCase() });
        if (exists) {
          if (duplicateAction === 'remove') await User.deleteOne({ _id: exists._id });
          else { skipped++; continue; }
        }
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(item.email.trim().toLowerCase(), 10);
        await User.create({
          name: item.name || 'Imported User', email: item.email.trim().toLowerCase(),
          password: hash, phone: item.phone || '',
          role: 'user', isActive: item.isActive !== false,
        });
        imported++;
      } catch { skipped++; }
    }
    results.users = { imported, skipped };
  }

  // --- contacts ---
  if (Array.isArray(bundle.contacts)) {
    const items = bundle.contacts;
    let imported = 0, skipped = 0;
    for (const item of items) {
      if (!item.email?.trim() || !item.message?.trim()) continue;
      try {
        const exists = await Contact.findOne({ email: item.email, message: item.message });
        if (exists) { if (duplicateAction === 'remove') await Contact.deleteOne({ _id: exists._id }); else { skipped++; continue; } }
        await Contact.create({ name: item.name || '', email: item.email, subject: item.subject || 'General', message: item.message, isRead: !!item.isRead });
        imported++;
      } catch { skipped++; }
    }
    results.contacts = { imported, skipped };
  }

  // --- reviews ---
  if (Array.isArray(bundle.reviews)) {
    const adminUser = await User.findOne({ role: 'admin' });
    let imported = 0, skipped = 0;
    for (const item of bundle.reviews) {
      if (!item.productName || !item.comment) continue;
      try {
        const product = await Product.findOne({ name: new RegExp(`^${item.productName.trim()}$`, 'i') });
        if (!product) { skipped++; continue; }
        const exists = product.reviews.some(r => r.name === item.reviewerName && r.comment === item.comment);
        if (exists) { skipped++; continue; }
        product.reviews.push({
          user: adminUser?._id,
          name: item.reviewerName || 'Imported User',
          rating: Math.min(5, Math.max(1, Number(item.rating) || 5)),
          comment: item.comment,
          isApproved: item.isApproved !== false,
        });
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
        await product.save();
        imported++;
      } catch { skipped++; }
    }
    results.reviews = { imported, skipped };
  }

  // analytics + orders + invoices: read-only or complex relational — skipped with note
  if (bundle.analytics) results.analytics = { note: 'Analytics is auto-generated and cannot be imported' };
  if (bundle.orders) results.orders = { note: 'Orders cannot be imported (relational data — use order management)' };
  if (bundle.invoices) results.invoices = { note: 'Invoices cannot be imported (linked to orders)' };

  res.json({ success: true, results });
};

module.exports = { exportData, importData };
