const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  originalPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: Number, required: true, default: 0 },
  totalStock: { type: Number, default: 0 },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  brand: { type: String, default: 'Women HubClub' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  weight: { type: String, default: '200g' },
  freshnessDays: { type: Number, default: 365 },
  status: { type: String, enum: ['published', 'draft', 'trash'], default: 'published' },
  draftedAt: { type: Date, default: null },
  trashedAt: { type: Date, default: null },
  specialOffer: {
    enabled:     { type: Boolean, default: false },
    label:       { type: String, default: '' },
    salePrice:   { type: Number, default: 0 },
    endsAt:      { type: Date, default: null },
  },
}, { timestamps: true });

// Auto-delete trashed products after 30 days
productSchema.index({ trashedAt: 1 }, { expireAfterSeconds: 2592000 });

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

productSchema.pre('save', async function (next) {
  if (this.isModified('slug') && this.slug) {
    // Admin set a custom slug — sanitize and ensure uniqueness
    let base = generateSlug(this.slug);
    let slug = base;
    let count = 1;
    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  } else if (!this.isModified('slug') && (this.isModified('name') || !this.slug)) {
    // Auto-generate from name
    let base = generateSlug(this.name);
    let slug = base;
    let count = 1;
    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
