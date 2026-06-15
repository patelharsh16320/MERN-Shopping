const Product       = require('../models/Product');
const Category      = require('../models/Category');
const User          = require('../models/User');
const UserAddress   = require('../models/UserAddress');
const Order         = require('../models/Order');
const Invoice       = require('../models/Invoice');
const Visit         = require('../models/Visit');
const Contact       = require('../models/Contact');
const Coupon        = require('../models/Coupon');
const Subscriber    = require('../models/Subscriber');
const Changelog     = require('../models/Changelog');
const SupportTicket = require('../models/SupportTicket');

const TYPES = ['products', 'categories', 'users', 'orders', 'invoices', 'analytics', 'contacts', 'reviews', 'coupons', 'subscribers', 'changelog', 'supportTickets'];

const CSV_FIELDS = {
  products:   ['name','description','price','originalPrice','discount','category','subcategory','images','stock','totalStock','rating','numReviews','brand','tags','isActive','isFeatured','weight','freshnessDays','status'],
  categories: ['name','icon','description','isActive','isDefault','parent'],
  users:      ['name','email','phone','role','isActive','createdAt'],
  orders:     ['_id','userEmail','totalPrice','orderStatus','paymentMethod','isPaid','trackingNumber','items','createdAt'],
  invoices:   ['invoiceNumber','status','total','subtotal','tax','shipping','paymentMethod','createdAt'],
  contacts:   ['name','email','subject','message','isRead','createdAt'],
  reviews:    ['productName','reviewerName','rating','comment','isApproved','createdAt'],
  coupons:    ['code','discountType','discountValue','minOrderAmount','maxUsage','usageCount','expiresAt','isActive','createdAt'],
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
      const allAddr = await UserAddress.find().lean();
      const addrMap = {};
      allAddr.forEach(a => {
        const uid = String(a.userId);
        if (!addrMap[uid]) addrMap[uid] = [];
        addrMap[uid].push({ label: a.label, street: a.street, city: a.city, state: a.state, zip: a.zip, country: a.country, isDefault: a.isDefault });
      });
      return rows.map(u => ({
        name: u.name, email: u.email, phone: u.phone || '',
        role: u.role, isActive: u.isActive, createdAt: u.createdAt,
        addresses: addrMap[String(u._id)] || [],
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
    case 'coupons': {
      const rows = await Coupon.find().lean();
      return rows.map(c => ({
        code: c.code, discountType: c.discountType, discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount, maxUsage: c.maxUsage, usageCount: c.usageCount,
        expiresAt: c.expiresAt || '', isActive: c.isActive, createdAt: c.createdAt,
      }));
    }
    case 'subscribers': {
      const rows = await Subscriber.find().lean();
      return rows.map(s => ({ email: s.email, createdAt: s.createdAt }));
    }
    case 'changelog': {
      const rows = await Changelog.find().sort({ order: 1 }).lean();
      return rows.map(c => ({
        icon: c.icon, tag: c.tag, title: c.title, summary: c.summary,
        before: c.before, after: c.after, date: c.date, order: c.order,
      }));
    }
    case 'supportTickets': {
      const rows = await SupportTicket.find().populate('user', 'email').lean();
      return rows.map(t => ({
        userEmail: t.user?.email || '', name: t.name, email: t.email,
        subject: t.subject, status: t.status,
        messages: (t.messages || []).map(m => ({ sender: m.sender, text: m.text, createdAt: m.createdAt })),
        createdAt: t.createdAt,
      }));
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
    if (imported > 0) {
      const io = req.app.get('io');
      if (io) io.to('public_room').emit('products_updated', { action: 'imported', count: imported });
    }
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
        const emailLower = item.email.trim().toLowerCase();
        const exists = await User.findOne({ email: emailLower });
        if (exists) {
          if (duplicateAction === 'remove') {
            await UserAddress.deleteMany({ userId: exists._id });
            await User.deleteOne({ _id: exists._id });
          } else { skipped++; continue; }
        }
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(emailLower, 10);
        const newUser = await User.create({
          name: item.name || 'Imported User', email: emailLower,
          password: hash, phone: item.phone || '',
          role: 'user', isActive: item.isActive !== false,
        });
        if (Array.isArray(item.addresses) && item.addresses.length > 0) {
          const addrDocs = item.addresses.map((a, idx) => ({
            userId: newUser._id,
            label: a.label || 'Home',
            street: a.street || '',
            city: a.city || '',
            state: a.state || '',
            zip: a.zip || '',
            country: a.country || 'India',
            isDefault: idx === 0,
          }));
          await UserAddress.insertMany(addrDocs);
        }
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

  // --- coupons ---
  if (Array.isArray(bundle.coupons)) {
    const items = bundle.coupons;
    let imported = 0, skipped = 0;
    for (const item of items) {
      if (!item.code?.trim() || !item.discountType || item.discountValue == null) continue;
      try {
        const code = item.code.trim().toUpperCase();
        const exists = await Coupon.findOne({ code });
        if (exists) {
          if (duplicateAction === 'remove') await Coupon.deleteOne({ _id: exists._id });
          else { skipped++; continue; }
        }
        await Coupon.create({
          code,
          discountType: item.discountType,
          discountValue: Number(item.discountValue) || 0,
          minOrderAmount: Number(item.minOrderAmount) || 0,
          maxUsage: Number(item.maxUsage) || 0,
          usageCount: 0,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          isActive: item.isActive !== false && item.isActive !== 'false',
        });
        imported++;
      } catch { skipped++; }
    }
    results.coupons = { imported, skipped };
  }

  // --- subscribers ---
  if (Array.isArray(bundle.subscribers)) {
    let imported = 0, skipped = 0;
    for (const item of bundle.subscribers) {
      if (!item.email?.trim()) continue;
      try {
        const exists = await Subscriber.findOne({ email: item.email.trim().toLowerCase() });
        if (exists) { if (duplicateAction === 'remove') await Subscriber.deleteOne({ _id: exists._id }); else { skipped++; continue; } }
        await Subscriber.create({ email: item.email.trim().toLowerCase() });
        imported++;
      } catch { skipped++; }
    }
    results.subscribers = { imported, skipped };
  }

  // --- changelog ---
  if (Array.isArray(bundle.changelog)) {
    let imported = 0, skipped = 0;
    for (const item of bundle.changelog) {
      if (!item.title?.trim() || !item.tag?.trim()) continue;
      try {
        const exists = await Changelog.findOne({ title: item.title.trim() });
        if (exists) { if (duplicateAction === 'remove') await Changelog.deleteOne({ _id: exists._id }); else { skipped++; continue; } }
        await Changelog.create({
          icon: item.icon || '✨', tag: item.tag, title: item.title,
          summary: item.summary || '', before: item.before || {}, after: item.after || {},
          date: item.date || '', order: item.order || 0,
        });
        imported++;
      } catch { skipped++; }
    }
    results.changelog = { imported, skipped };
  }

  // analytics + orders + invoices + supportTickets: read-only or complex relational — skipped with note
  if (bundle.analytics) results.analytics = { note: 'Analytics is auto-generated and cannot be imported' };
  if (bundle.orders) results.orders = { note: 'Orders cannot be imported (relational data — use order management)' };
  if (bundle.invoices) results.invoices = { note: 'Invoices cannot be imported (linked to orders)' };
  if (bundle.supportTickets) results.supportTickets = { note: 'Support tickets cannot be imported (linked to users)' };

  res.json({ success: true, results });
};

module.exports = { exportData, importData };
