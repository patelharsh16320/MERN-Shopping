import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { productAPI, categoryAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', description: '', price: '', originalPrice: '', discount: 0, category: '', images: [''], stock: '', totalStock: '', rating: 0, numReviews: 0, isFeatured: false, freshnessDays: 365, weight: '200g', brand: 'Women HubClub', tags: '' };
const PROD_COLS = ['Category', 'Price', 'Stock', 'Rating', 'Featured', 'Reviews'];

function SortTh({ label, field, sortField, sortDir, onSort, style }) {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
      {label}&nbsp;<span style={{ fontSize: 9, opacity: active ? 1 : 0.25 }}>{active && sortDir === 'desc' ? '▼' : '▲'}</span>
    </th>
  );
}

function getVal(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewsModal, setReviewsModal] = useState({ open: false, product: null, reviews: [], loading: false });
  const [visibleCols, setVisibleCols] = useState(() => Object.fromEntries(PROD_COLS.map(c => [c, true])));
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const toggleCol = (col) => setVisibleCols(v => ({ ...v, [col]: !v[col] }));

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedProducts = useMemo(() => {
    if (!sortField) return products;
    return [...products].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, sortField, sortDir]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await productAPI.adminGetAll(params);
      setProducts(data.products);
      setTotalPages(data.pages);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({ ...emptyForm, ...p, images: p.images?.length ? p.images : [''], tags: p.tags?.join(', ') || '', totalStock: p.totalStock || p.stock || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], images: form.images.filter(Boolean) };
      if (!payload.totalStock) payload.totalStock = payload.stock;
      if (editing) { await productAPI.update(editing, payload); toast.success('Product updated!'); }
      else { await productAPI.create(payload); toast.success('Product created!'); }
      setModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await productAPI.delete(id); toast.success('Deleted!'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const openReviews = async (p) => {
    setReviewsModal({ open: true, product: p, reviews: [], loading: true });
    try {
      const { data } = await productAPI.getById(p._id);
      setReviewsModal({ open: true, product: p, reviews: data.reviews || [], loading: false });
    } catch {
      setReviewsModal(m => ({ ...m, loading: false }));
    }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🌸 <span className="gradient-text">Manage Products</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {PROD_COLS.map(col => (
            <button key={col} onClick={() => toggleCol(col)}
              style={{ padding: '4px 12px', borderRadius: 20, border: `2px solid ${visibleCols[col] ? '#6c63ff' : '#e0e0e0'}`, background: visibleCols[col] ? '#f0f0ff' : 'white', color: visibleCols[col] ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {visibleCols[col] ? '✓ ' : ''}{col}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <SortTh label="Name" field="name" {...sortProps} />
              {visibleCols['Category'] && <SortTh label="Category" field="category" {...sortProps} />}
              {visibleCols['Price'] && <SortTh label="Price" field="price" {...sortProps} />}
              {visibleCols['Stock'] && <SortTh label="Stock" field="stock" {...sortProps} />}
              {visibleCols['Rating'] && <SortTh label="Rating" field="rating" {...sortProps} />}
              {visibleCols['Featured'] && <SortTh label="Featured" field="isFeatured" {...sortProps} />}
              {visibleCols['Reviews'] && <th>Reviews</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : sortedProducts.map(p => {
              const reviewCount = p.reviews?.length ?? p.numReviews ?? 0;
              return (
                <tr key={p._id}>
                  <td><img src={p.images?.[0]} alt={p.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /></td>
                  <td style={{ fontWeight: 600, maxWidth: 200 }}>{p.name}</td>
                  {visibleCols['Category'] && <td><span className="badge badge-processing">{p.category}</span></td>}
                  {visibleCols['Price'] && <td><span style={{ fontWeight: 700, color: '#6c63ff' }}>₹{p.price}</span>{p.originalPrice > p.price && <span style={{ textDecoration: 'line-through', color: '#636e72', fontSize: 12, marginLeft: 6 }}>₹{p.originalPrice}</span>}</td>}
                  {visibleCols['Stock'] && (
                    <td>
                      <span style={{ fontWeight: 700, color: p.stock < 10 ? '#d63031' : '#2d3436' }}>{p.stock}</span>
                    </td>
                  )}
                  {visibleCols['Rating'] && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#f9a825' }}>⭐</span>
                        <span style={{ fontWeight: 700, color: '#424242', fontSize: 14 }}>{p.rating ? p.rating.toFixed(1) : '0.0'}</span>
                      </div>
                    </td>
                  )}
                  {visibleCols['Featured'] && <td>{p.isFeatured ? '✅' : '—'}</td>}
                  {visibleCols['Reviews'] && (
                    <td>
                      <button className="btn btn-sm" style={{ background: reviewCount > 0 ? '#fff8e1' : '#f5f5f5', color: reviewCount > 0 ? '#e65100' : '#9e9e9e', borderRadius: 20, whiteSpace: 'nowrap' }} onClick={() => openReviews(p)}>
                        💬 {reviewCount}
                      </button>
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p._id, p.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'zoomIn 0.3s ease' }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>💬 Customer Reviews</h2>
                <div style={{ fontSize: 13, color: '#9e9e9e' }}>{reviewsModal.product?.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!reviewsModal.loading && <span style={{ padding: '4px 14px', background: '#fff8e1', color: '#e65100', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{reviewsModal.reviews.length} review{reviewsModal.reviews.length !== 1 ? 's' : ''}</span>}
                <button onClick={() => setReviewsModal({ open: false, product: null, reviews: [], loading: false })} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
              </div>
            </div>
            {!reviewsModal.loading && reviewsModal.reviews.length > 0 && (
              <div style={{ padding: '14px 28px', background: '#f8f7ff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#6c63ff' }}>{(reviewsModal.reviews.reduce((s, r) => s + r.rating, 0) / reviewsModal.reviews.length).toFixed(1)}</div>
                  <div style={{ color: '#f9a825', fontSize: 18 }}>{'⭐'.repeat(Math.round(reviewsModal.reviews.reduce((s, r) => s + r.rating, 0) / reviewsModal.reviews.length))}</div>
                  <div style={{ fontSize: 12, color: '#9e9e9e' }}>avg rating</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewsModal.reviews.filter(r => r.rating === star).length;
                    const pct = Math.round((count / reviewsModal.reviews.length) * 100);
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: '#9e9e9e', width: 14 }}>{star}</span>
                        <span style={{ color: '#f9a825', fontSize: 12 }}>⭐</span>
                        <div style={{ flex: 1, height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6c63ff,#fd79a8)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#9e9e9e', width: 28 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ overflowY: 'auto', padding: '16px 28px 28px' }}>
              {reviewsModal.loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>Loading reviews...</div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 600, color: '#424242' }}>No reviews yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviewsModal.reviews.map((rev, i) => (
                    <div key={i} style={{ padding: '16px 20px', background: '#fafafa', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{rev.name}</span>
                          <div style={{ color: '#f9a825', fontSize: 16, marginTop: 3 }}>{'⭐'.repeat(rev.rating)} <span style={{ color: '#9e9e9e', fontSize: 12 }}>{rev.rating}/5</span></div>
                        </div>
                        <div style={{ fontSize: 12, color: '#bdbdbd', textAlign: 'right' }}>
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          {rev.updatedAt && rev.updatedAt !== rev.createdAt && <div style={{ color: '#c2185b', marginTop: 2 }}>edited</div>}
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: '#424242', lineHeight: 1.7, margin: 0 }}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Edit/Add Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 22 }}>{editing ? '✏️ Edit Product' : '➕ Add Product'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price (₹)</label>
                  <input className="form-input" type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Stock *</label>
                  <input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total / Max Stock</label>
                  <input className="form-input" type="number" placeholder="Defaults to Current Stock" value={form.totalStock} onChange={e => setForm({ ...form, totalStock: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Image URL</label>
                  <input className="form-input" placeholder="https://images.unsplash.com/..." value={form.images[0]} onChange={e => setForm({ ...form, images: [e.target.value] })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" placeholder="skincare, glow, bestseller" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} style={{ width: 20, height: 20 }} />
                    Mark as Featured
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
