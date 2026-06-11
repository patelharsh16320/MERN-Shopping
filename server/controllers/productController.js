const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    let query = { isActive: true };
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.$or = [{ name: new RegExp(req.query.search, 'i') }, { description: new RegExp(req.query.search, 'i') }];
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.rating) query.rating = { $gte: Number(req.query.rating) };
    let sort = {};
    if (req.query.sort === 'price_asc') sort = { price: 1 };
    else if (req.query.sort === 'price_desc') sort = { price: -1 };
    else if (req.query.sort === 'rating') sort = { rating: -1 };
    else if (req.query.sort === 'newest') sort = { createdAt: -1 };
    else sort = { isFeatured: -1, createdAt: -1 };
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sort).skip(skip).limit(limit);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    let product;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar');
    } else {
      product = await Product.findOne({ slug: req.params.id }).populate('reviews.user', 'name avatar');
    }
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.totalStock) body.totalStock = body.stock;
    const product = new Product(body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    Object.assign(product, req.body);
    if (!product.totalStock) product.totalStock = product.stock;
    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ message: 'Already reviewed' });
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const review = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.rating  = Number(rating);
    review.comment = comment;
    product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.search) query.$or = [{ name: new RegExp(req.query.search, 'i') }, { description: new RegExp(req.query.search, 'i') }];
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(8);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toCSV = (rows, fields) => {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
  return [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
};

const PRODUCT_CSV_FIELDS = ['name', 'description', 'price', 'originalPrice', 'discount', 'category', 'subcategory', 'images', 'stock', 'totalStock', 'rating', 'numReviews', 'brand', 'tags', 'isActive', 'isFeatured', 'weight', 'freshnessDays'];

const exportProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const data = products.map(p => ({
      name: p.name, description: p.description, price: p.price,
      originalPrice: p.originalPrice, discount: p.discount,
      category: p.category, subcategory: p.subcategory || '',
      images: (p.images || []).join(';'), stock: p.stock, totalStock: p.totalStock,
      rating: p.rating, numReviews: p.numReviews, brand: p.brand,
      tags: (p.tags || []).join(';'), isActive: p.isActive, isFeatured: p.isFeatured,
      weight: p.weight, freshnessDays: p.freshnessDays,
    }));
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(toCSV(data, PRODUCT_CSV_FIELDS));
    }
    // For JSON export, return arrays as-is
    const jsonData = products.map(p => ({
      name: p.name, description: p.description, price: p.price,
      originalPrice: p.originalPrice, discount: p.discount,
      category: p.category, subcategory: p.subcategory || '',
      images: p.images, stock: p.stock, totalStock: p.totalStock,
      rating: p.rating, numReviews: p.numReviews, brand: p.brand,
      tags: p.tags, isActive: p.isActive, isFeatured: p.isFeatured,
      weight: p.weight, freshnessDays: p.freshnessDays,
    }));
    res.json(jsonData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importProducts = async (req, res) => {
  try {
    const { items, duplicateAction } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const names = items.map(i => i.name?.trim()).filter(Boolean);
    const existing = await Product.find({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
    const existingNamesLower = existing.map(p => p.name.toLowerCase());

    let removed = 0, imported = 0, skipped = 0;

    if (duplicateAction === 'remove') {
      if (existing.length) {
        await Product.deleteMany({ _id: { $in: existing.map(p => p._id) } });
        removed = existing.length;
      }
    }

    for (const item of items) {
      if (!item.name?.trim()) continue;
      const nameLower = item.name.trim().toLowerCase();
      if (duplicateAction === 'ignore' && existingNamesLower.includes(nameLower)) { skipped++; continue; }
      try {
        const stock = Number(item.stock) || 0;
        await Product.create({
          name: item.name.trim(), description: item.description || '',
          price: Number(item.price) || 0, originalPrice: Number(item.originalPrice) || 0,
          discount: Number(item.discount) || 0, category: item.category || 'General',
          subcategory: item.subcategory || '', images: item.images || [],
          stock, totalStock: Number(item.totalStock) || stock,
          rating: Number(item.rating) || 0, numReviews: Number(item.numReviews) || 0,
          brand: item.brand || 'Women HubClub', tags: item.tags || [],
          isActive: item.isActive !== false, isFeatured: !!item.isFeatured,
          weight: item.weight || '200g', freshnessDays: Number(item.freshnessDays) || 365,
        });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, removed, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview, updateReview, getFeatured, getCategories, exportProducts, importProducts };
