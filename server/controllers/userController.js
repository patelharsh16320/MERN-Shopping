const User = require('../models/User');

const toCSV = (rows, fields) => {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    user.phone = req.body.phone || user.phone;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    const admins = await User.countDocuments({ role: 'admin' });
    res.json({ total, active, admins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const data = users.map(u => ({
      name: u.name, email: u.email, phone: u.phone || '',
      role: u.role, isActive: u.isActive,
    }));
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(toCSV(data, ['name', 'email', 'phone', 'role', 'isActive']));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importUsers = async (req, res) => {
  try {
    const { items, duplicateAction } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const emails = items.map(i => i.email?.trim().toLowerCase()).filter(Boolean);
    const existing = await User.find({ email: { $in: emails } });
    const existingEmails = existing.map(u => u.email.toLowerCase());

    let removed = 0, imported = 0, skipped = 0;

    if (duplicateAction === 'remove') {
      const deletable = existing.filter(u => u.role !== 'admin');
      if (deletable.length) {
        await User.deleteMany({ _id: { $in: deletable.map(u => u._id) } });
        removed = deletable.length;
      }
    }

    for (const item of items) {
      if (!item.email?.trim() || !item.name?.trim()) continue;
      const emailLower = item.email.trim().toLowerCase();
      if (duplicateAction === 'ignore' && existingEmails.includes(emailLower)) { skipped++; continue; }
      try {
        await User.create({
          name: item.name.trim(),
          email: emailLower,
          password: item.email.trim(),
          phone: item.phone || '',
          role: item.role === 'admin' ? 'user' : (item.role || 'user'),
          isActive: item.isActive !== false && item.isActive !== 'false',
        });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, removed, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getStats, exportUsers, importUsers };
