import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { productAPI, categoryAPI, uploadAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { getSocket } from '../../utils/socket';

const emptyForm = { name: '', slug: '', description: '', price: '', originalPrice: '', discount: 0, category: '', subcategory: '', images: [''], stock: '', totalStock: '', rating: 0, numReviews: 0, isFeatured: false, isActive: true, freshnessDays: 365, weight: '200g', brand: 'Women HubClub', tags: '', status: 'published', specialOffer: { enabled: false, label: '', salePrice: '', endsAt: '' } };

function autoSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const PROD_COLS = ['Category', 'Price', 'Stock', 'Rating', 'Featured', 'Reviews'];
const PAGE_SIZE = 10;
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'trash', label: 'Trash' },
];
const STATUS_COLORS = { published: '#00b894', draft: '#f39c12', trash: '#d63031' };
const STATUS_BG = { published: '#f0fdf4', draft: '#fffbf0', trash: '#fff0f0' };

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

function Paginator({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i <= 2 || i > totalPages - 2 || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div className="pagination" style={{ marginTop: 16 }}>
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 6px', color: '#9e9e9e', alignSelf: 'center' }}>…</span>
          : <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
}

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [reviewsModal, setReviewsModal] = useState({ open: false, product: null, reviews: [], loading: false });
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_products') || '{}');
      return Object.fromEntries(PROD_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(PROD_COLS.map(c => [c, true])); }
  });
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [slugEdit, setSlugEdit] = useState({ id: null, value: '' });

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('admin_cols_products', JSON.stringify(next));
    return next;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (statusFilter !== 'all') {
      list = list.filter(p => (p.status || 'published') === statusFilter);
    }
    if (activeFilter === 'active')   list = list.filter(p => p.isActive !== false);
    if (activeFilter === 'inactive') list = list.filter(p => p.isActive === false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, statusFilter, activeFilter]);

  const sortedProducts = useMemo(() => {
    if (!sortField) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredProducts, sortField, sortDir]);

  const totalPages = Math.ceil(sortedProducts.length / PAGE_SIZE);
  const paginated = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts = useMemo(() => {
    const counts = { all: products.length };
    STATUS_TABS.slice(1).forEach(t => {
      counts[t.key] = products.filter(p => (p.status || 'published') === t.key).length;
    });
    counts.active   = products.filter(p => p.isActive !== false).length;
    counts.inactive = products.filter(p => p.isActive === false).length;
    return counts;
  }, [products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.adminGetAll({ limit: 10000 });
      setProducts(data.products);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  // Refresh product list when products change via socket (import, create, update, delete)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdated = () => fetchProducts();
    socket.on('products_updated', onUpdated);
    return () => socket.off('products_updated', onUpdated);
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({ ...emptyForm, ...p, slug: p.slug || '', images: p.images?.length ? p.images : [''], tags: p.tags?.join(', ') || '', totalStock: p.totalStock || p.stock || '', subcategory: p.subcategory || '', status: p.status || 'published', isActive: p.isActive !== false, specialOffer: { enabled: p.specialOffer?.enabled || false, label: p.specialOffer?.label || '', salePrice: p.specialOffer?.salePrice || '', endsAt: p.specialOffer?.endsAt ? new Date(p.specialOffer.endsAt).toISOString().slice(0, 16) : '' } });
    setModal(true);
  };

  const handleToggleActive = async (p) => {
    try {
      await productAPI.update(p._id, { isActive: !p.isActive });
      toast.success(p.isActive ? `"${p.name}" disabled` : `"${p.name}" enabled`);
      fetchProducts();
    } catch { toast.error('Failed to update'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category: form.category || 'General', tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], images: form.images.filter(Boolean) };
      if (!payload.slug) delete payload.slug;
      if (!payload.totalStock) payload.totalStock = payload.stock;
      if (payload.specialOffer) {
        payload.specialOffer = { ...payload.specialOffer, salePrice: parseFloat(payload.specialOffer.salePrice) || 0, endsAt: payload.specialOffer.endsAt || null };
      }
      if (editing) { await productAPI.update(editing, payload); toast.success('Product updated!'); }
      else { await productAPI.create(payload); toast.success('Product created!'); }
      setModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    setSaving(false);
  };

  const handleTrash = async (id, name) => {
    if (!window.confirm(`Move "${name}" to Trash? It will be permanently deleted after 30 days.`)) return;
    try {
      await productAPI.update(id, { status: 'trash' });
      toast.success('Moved to Trash');
      fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleRestore = async (id) => {
    try {
      await productAPI.update(id, { status: 'published' });
      toast.success('Restored to Published');
      fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteForever = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try { await productAPI.delete(id); toast.success('Permanently deleted!'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await uploadAPI.image(file);
      setForm(prev => {
        const imgs = [...prev.images];
        imgs[idx] = data.url;
        return { ...prev, images: imgs };
      });
      toast.success('Image uploaded!');
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    e.target.value = '';
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

  const toggleSelect = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.map(p => p._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkTrash = async () => {
    if (!window.confirm(`Move ${selectedIds.size} product(s) to Trash? They will be deleted after 30 days.`)) return;
    try {
      await Promise.all([...selectedIds].map(id => productAPI.update(id, { status: 'trash' })));
      toast.success(`${selectedIds.size} product(s) moved to Trash`);
      setSelectedIds(new Set()); fetchProducts();
    } catch { toast.error('Some operations failed'); }
  };
  const handleBulkDeleteForever = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} product(s)? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map(id => productAPI.delete(id)));
      toast.success(`${selectedIds.size} product(s) permanently deleted`);
      setSelectedIds(new Set()); fetchProducts();
    } catch { toast.error('Some deletions failed'); }
  };
  const handleBulkRestore = async () => {
    try {
      await Promise.all([...selectedIds].map(id => productAPI.update(id, { status: 'published' })));
      toast.success(`${selectedIds.size} product(s) restored`);
      setSelectedIds(new Set()); fetchProducts();
    } catch { toast.error('Some operations failed'); }
  };

  const handleSlugSave = async (id) => {
    const val = slugEdit.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!val) { setSlugEdit({ id: null, value: '' }); return; }
    try {
      await productAPI.update(id, { slug: val });
      toast.success('URL slug updated');
      fetchProducts();
    } catch { toast.error('Failed to update slug'); }
    setSlugEdit({ id: null, value: '' });
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🌸 <span className="gradient-text">Manage Products</span></h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {search || statusFilter !== 'all' ? `${sortedProducts.length} / ${products.length}` : products.length} products
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9e9e9e', marginRight: 4 }}>Status:</span>
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); setSelectedIds(new Set()); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: `2px solid ${statusFilter === tab.key ? '#6c63ff' : '#e0e0e0'}`, background: statusFilter === tab.key ? '#f0f0ff' : 'white', color: statusFilter === tab.key ? '#6c63ff' : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {tab.label}
            <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: statusFilter === tab.key ? '#6c63ff' : '#f0f0f0', color: statusFilter === tab.key ? 'white' : '#9e9e9e', fontSize: 11, fontWeight: 700 }}>
              {tabCounts[tab.key] ?? 0}
            </span>
          </button>
        ))}
        <span style={{ width: 1, height: 24, background: '#e0e0e0', margin: '0 4px' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9e9e9e', marginRight: 4 }}>Visibility:</span>
        {[
          { key: 'all',      label: 'All',      color: '#636e72', bg: '#f5f5f5' },
          { key: 'active',   label: '🟢 Active',   color: '#2e7d32', bg: '#e8f5e9' },
          { key: 'inactive', label: '🔴 Inactive', color: '#d63031', bg: '#fff0f0' },
        ].map(f => (
          <button key={f.key} onClick={() => { setActiveFilter(f.key); setPage(1); setSelectedIds(new Set()); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: `2px solid ${activeFilter === f.key ? f.color : '#e0e0e0'}`, background: activeFilter === f.key ? f.bg : 'white', color: activeFilter === f.key ? f.color : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {f.label}
            <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: activeFilter === f.key ? f.color : '#f0f0f0', color: activeFilter === f.key ? 'white' : '#9e9e9e', fontSize: 11, fontWeight: 700 }}>
              {f.key === 'all' ? tabCounts.all : (tabCounts[f.key] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 280 }} />

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

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fff0f0', borderRadius: 12, marginBottom: 14, border: '2px solid #ffcccc', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828' }}>{selectedIds.size} selected</span>
          {statusFilter === 'trash' ? (
            <>
              <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#00b894' }} onClick={handleBulkRestore}>↩ Restore Selected</button>
              <button className="btn btn-sm btn-danger" onClick={handleBulkDeleteForever}>🗑 Delete Forever</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm" style={{ background: '#fff8f0', color: '#e17055', border: '1px solid #ffd5c2' }} onClick={handleBulkTrash}>🗑 Trash Selected</button>
              <button className="btn btn-sm btn-danger" onClick={handleBulkDeleteForever}>🗑 Delete Forever</button>
            </>
          )}
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedIds(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.length > 0 && paginated.every(p => selectedIds.has(p._id))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              <th>Image</th>
              <SortTh label="Name" field="name" {...sortProps} />
              <th>Status</th>
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
              <tr><td colSpan={6 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No products found.</td></tr>
            ) : paginated.map((p, i) => {
              const reviewCount = p.reviews?.length ?? p.numReviews ?? 0;
              const status = p.status || 'published';
              const isTrash = status === 'trash';
              return (
                <tr key={p._id} style={isTrash ? { opacity: 0.65, background: '#fff8f8' } : {}}>
                  <td><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                    checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                  <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={p.images?.[0]} alt={p.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                      {p.images?.length > 1 && (
                        <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 6 }}>
                          +{p.images.length - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {slugEdit.id === p._id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 11, color: '#9e9e9e', fontFamily: 'monospace', flexShrink: 0 }}>/</span>
                        <input
                          autoFocus
                          value={slugEdit.value}
                          onChange={e => setSlugEdit(s => ({ ...s, value: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSlugSave(p._id); if (e.key === 'Escape') setSlugEdit({ id: null, value: '' }); }}
                          onBlur={() => handleSlugSave(p._id)}
                          style={{ fontSize: 11, fontFamily: 'monospace', border: '1.5px solid #6c63ff', borderRadius: 6, padding: '2px 6px', width: 140, outline: 'none', color: '#6c63ff' }}
                        />
                      </div>
                    ) : (
                      <div
                        title="Click to edit URL slug"
                        onClick={e => { e.stopPropagation(); setSlugEdit({ id: p._id, value: p.slug || autoSlug(p.name) }); }}
                        style={{ fontSize: 11, color: '#9e9e9e', fontFamily: 'monospace', marginTop: 3, cursor: 'text', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, border: '1px dashed transparent', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c63ff55'; e.currentTarget.style.color = '#6c63ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#9e9e9e'; }}>
                        ✏️ /{p.slug || autoSlug(p.name)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: STATUS_BG[status] || '#f5f5f5', color: STATUS_COLORS[status] || '#636e72', textTransform: 'capitalize', border: `1px solid ${STATUS_COLORS[status] || '#e0e0e0'}33` }}>
                        {status}
                      </span>
                      {!isTrash && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: p.isActive !== false ? '#00b894' : '#d63031' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.isActive !== false ? '#00b894' : '#d63031', display: 'inline-block' }} />
                          {p.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      )}
                      {p.specialOffer?.enabled && (
                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#fff3e0', color: '#e17055', border: '1px solid #ffe0b2' }}>
                          🔥 On Sale
                        </span>
                      )}
                    </div>
                  </td>
                  {visibleCols['Category'] && (
                    <td>
                      <span className="badge badge-processing">{p.category}</span>
                      {p.subcategory && <span style={{ marginLeft: 4, fontSize: 11, background: '#f3e5f5', color: '#6a1b9a', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>↳ {p.subcategory}</span>}
                    </td>
                  )}
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a href={`/products/${p.slug || p._id}`} target="_blank" rel="noreferrer"
                        className="btn btn-sm"
                        style={{ background: '#e8f5e9', color: '#00897b', borderRadius: 20, textDecoration: 'none', whiteSpace: 'nowrap' }}
                        title={`/products/${p.slug || p._id}`}>
                        🔗 View
                      </a>
                      {isTrash ? (
                        <>
                          <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#00b894', borderRadius: 20, whiteSpace: 'nowrap' }} onClick={() => handleRestore(p._id)}>↩ Restore</button>
                          <button className="btn btn-sm btn-danger" style={{ whiteSpace: 'nowrap' }} onClick={() => handleDeleteForever(p._id, p.name)}>🗑 Forever</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(p)}>Edit</button>
                          <button
                            className="btn btn-sm"
                            title={p.isActive !== false ? 'Disable product (hide from store)' : 'Enable product (show in store)'}
                            onClick={() => handleToggleActive(p)}
                            style={{ borderRadius: 20, whiteSpace: 'nowrap', background: p.isActive !== false ? '#e8f5e9' : '#fff0f0', color: p.isActive !== false ? '#2e7d32' : '#d63031', border: `1px solid ${p.isActive !== false ? '#a5d6a7' : '#ffcdd2'}` }}>
                            {p.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                          </button>
                          <button className="btn btn-sm" style={{ background: '#fff8f0', color: '#e17055', borderRadius: 20, border: '1px solid #ffd5c2' }} onClick={() => handleTrash(p._id, p.name)}>🗑 Trash</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

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
                  <label className="form-label">
                    URL Slug
                    <span style={{ fontWeight: 400, fontSize: 12, color: '#9e9e9e', marginLeft: 8 }}>auto-generated from name — edit to customise</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden', background: 'white', focusWithin: { borderColor: '#6c63ff' } }}>
                    <span style={{ padding: '10px 12px', background: '#f5f5f5', color: '#9e9e9e', fontSize: 13, whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', lineHeight: 1 }}>
                      /products/
                    </span>
                    <input
                      className="form-input"
                      style={{ border: 'none', borderRadius: 0, flex: 1, outline: 'none', boxShadow: 'none', fontSize: 14, fontFamily: 'monospace' }}
                      placeholder={form.name ? autoSlug(form.name) : 'product-url-slug'}
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    {form.slug && (
                      <button type="button" title="Clear (auto-regenerate from name)"
                        onClick={() => setForm({ ...form, slug: '' })}
                        style={{ padding: '10px 12px', background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>
                    Preview: <span style={{ fontFamily: 'monospace', color: '#6c63ff' }}>
                      {window.location.origin}/products/{form.slug || (form.name ? autoSlug(form.name) : '...')}
                    </span>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category <span style={{ fontWeight: 400, fontSize: 12, color: '#9e9e9e' }}>(defaults to "General")</span></label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subcategory: '' })}>
                    <option value="">General (default)</option>
                    {categories.filter(c => !c.parent).map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                {form.category && categories.some(c => c.parent?.name === form.category) && (
                  <div className="form-group">
                    <label className="form-label">Subcategory <span style={{ fontWeight: 400, fontSize: 12, color: '#9e9e9e' }}>(optional)</span></label>
                    <select className="form-select" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}>
                      <option value="">— None —</option>
                      {categories.filter(c => c.parent?.name === form.category).map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="published">Published — visible to customers</option>
                    <option value="draft">Draft — hidden from customers</option>
                    <option value="trash">Trash — auto-deleted after 30 days</option>
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
                  <label className="form-label">
                    Images
                    <span style={{ fontWeight: 400, fontSize: 12, color: '#9e9e9e', marginLeft: 8 }}>paste a URL or upload from your computer</span>
                  </label>
                  {form.images.map((img, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: '#f5f5f5', flexShrink: 0, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                        {img
                          ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = '#fee'; }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#bdbdbd' }}>🖼️</div>
                        }
                      </div>
                      <input
                        className="form-input"
                        placeholder="https://images.unsplash.com/..."
                        value={img}
                        onChange={e => {
                          const imgs = [...form.images];
                          imgs[idx] = e.target.value;
                          setForm({ ...form, images: imgs });
                        }}
                        style={{ flex: 1 }}
                      />
                      <label style={{ cursor: 'pointer', padding: '9px 14px', background: '#f0f0ff', color: '#6c63ff', borderRadius: 10, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', border: '1px solid #d0c9ff', lineHeight: 1.4 }}>
                        📎 Upload
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, idx)} />
                      </label>
                      {form.images.length > 1 && (
                        <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                          style={{ padding: '9px 12px', background: '#fff0f0', color: '#d63031', border: '1px solid #ffcdd2', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ''] })}
                    style={{ width: '100%', padding: '8px', background: '#fafafe', color: '#6c63ff', border: '2px dashed #d0c9ff', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    + Add Another Image
                  </button>
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
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 20, height: 20, accentColor: '#00b894' }} />
                    <span>Active <span style={{ fontWeight: 400, fontSize: 12, color: '#9e9e9e' }}>(uncheck to hide from store without trashing)</span></span>
                  </label>
                </div>
              </div>

              {/* Special Offer */}
              <div style={{ background: '#fff9f0', borderRadius: 16, padding: 18, border: '2px solid #ffe0b2', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, marginBottom: form.specialOffer?.enabled ? 14 : 0 }}>
                  <input type="checkbox" checked={!!form.specialOffer?.enabled}
                    onChange={e => setForm(f => ({ ...f, specialOffer: { ...f.specialOffer, enabled: e.target.checked } }))}
                    style={{ width: 20, height: 20, accentColor: '#e17055' }} />
                  🔥 Special Offer / Flash Sale
                </label>
                {form.specialOffer?.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Offer Badge Label</label>
                      <input className="form-input" placeholder="e.g. Flash Sale, 50% OFF, Deal of the Day"
                        value={form.specialOffer?.label || ''} onChange={e => setForm(f => ({ ...f, specialOffer: { ...f.specialOffer, label: e.target.value } }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Sale Price (₹)</label>
                      <input className="form-input" type="number" min="0" placeholder="Sale price"
                        value={form.specialOffer?.salePrice || ''} onChange={e => setForm(f => ({ ...f, specialOffer: { ...f.specialOffer, salePrice: e.target.value } }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Offer Ends At (optional)</label>
                      <input className="form-input" type="datetime-local"
                        value={form.specialOffer?.endsAt || ''} onChange={e => setForm(f => ({ ...f, specialOffer: { ...f.specialOffer, endsAt: e.target.value } }))} />
                    </div>
                  </div>
                )}
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
