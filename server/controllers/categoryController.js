const Category = require('../models/Category');
const Product = require('../models/Product');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name icon').sort({ name: 1 });
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const subCounts = await Product.aggregate([
      { $match: { isActive: true, subcategory: { $nin: [null, ''] } } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));
    const subCountMap = Object.fromEntries(subCounts.map(c => [c._id, c.count]));
    const result = categories.map(cat => ({
      ...cat.toObject(),
      productCount: countMap[cat.name] || subCountMap[cat.name] || 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, parent } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(400).json({ message: 'Category already exists' });
    if (parent) {
      const parentCat = await Category.findById(parent);
      if (!parentCat) return res.status(400).json({ message: 'Parent category not found' });
      if (parentCat.isDefault) return res.status(400).json({ message: 'The "General" category cannot be used as a parent' });
    }
    const category = await Category.create({ name, description, icon, parent: parent || null });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const { name, description, icon, isActive, parent } = req.body;
    if (parent !== undefined && parent) {
      if (category.isDefault) return res.status(400).json({ message: 'The "General" category must remain a top-level parent category' });
      const parentCat = await Category.findById(parent);
      if (!parentCat) return res.status(400).json({ message: 'Parent category not found' });
      if (parentCat.isDefault) return res.status(400).json({ message: 'The "General" category cannot be used as a parent' });
    }
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (parent !== undefined) category.parent = parent || null;
    const updated = await category.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (category.isDefault) return res.status(400).json({ message: 'The default "General" category cannot be deleted' });
    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toCSV = (rows, fields) => {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

const exportCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name').sort({ name: 1 });
    const data = categories.map(cat => ({
      name: cat.name, icon: cat.icon, description: cat.description,
      isActive: cat.isActive, parent: cat.parent?.name || '',
    }));
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(toCSV(data, ['name', 'icon', 'description', 'isActive', 'parent']));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importCategories = async (req, res) => {
  try {
    const { items, duplicateAction } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const names = items.map(i => i.name?.trim()).filter(Boolean);
    const existing = await Category.find({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
    const existingNamesLower = existing.map(c => c.name.toLowerCase());

    let removed = 0, imported = 0, skipped = 0;

    if (duplicateAction === 'remove') {
      const deletable = existing.filter(c => !c.isDefault);
      if (deletable.length) {
        await Category.deleteMany({ _id: { $in: deletable.map(c => c._id) } });
        removed = deletable.length;
      }
    }

    for (const item of items) {
      if (!item.name?.trim()) continue;
      const nameLower = item.name.trim().toLowerCase();
      if (duplicateAction === 'ignore' && existingNamesLower.includes(nameLower)) { skipped++; continue; }
      let parentId = null;
      if (item.parent) {
        const parentCat = await Category.findOne({ name: new RegExp(`^${item.parent}$`, 'i') });
        if (parentCat && !parentCat.isDefault) parentId = parentCat._id;
      }
      try {
        await Category.create({ name: item.name.trim(), icon: item.icon || '🏷️', description: item.description || '', isActive: item.isActive !== false, parent: parentId });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, removed, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, exportCategories, importCategories };
