import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { categoryAPI } from '../../utils/api';
import { toast } from 'react-toastify';
const CAT_COLS = ['Description', 'Type', 'Products', 'Status', 'Added'];
const PAGE_SIZE = 10;
const emptyForm = { name: '', description: '', icon: '🏷️', parent: '' };

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

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_categories') || '{}');
      return Object.fromEntries(CAT_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(CAT_COLS.map(c => [c, true])); }
  });
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data);
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('admin_cols_categories', JSON.stringify(next));
    return next;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const topLevel = useMemo(() => categories.filter(c => !c.parent), [categories]);
  const parentOptions = useMemo(() => topLevel.filter(c => c._id !== editing && !c.isDefault), [topLevel, editing]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.parent?.name || '').toLowerCase().includes(q)
    );
  }, [categories, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🏷️', parent: cat.parent?._id || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.warning('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoryAPI.update(editing, form);
        toast.success('Category updated!');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created!');
      }
      setModal(false);
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products using this category will keep their existing value.`)) return;
    try { await categoryAPI.delete(id); toast.success('Category deleted!'); fetchCategories(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const toggleActive = async (cat) => {
    try {
      await categoryAPI.update(cat._id, { isActive: !cat.isActive });
      fetchCategories();
    } catch { toast.error('Update failed'); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.filter(c => !c.isDefault).map(c => c._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    const deletable = [...selectedIds].filter(id => !categories.find(c => c._id === id && c.isDefault));
    if (deletable.length === 0) { toast.warning('Cannot delete default categories'); return; }
    if (!window.confirm(`Delete ${deletable.length} category/categories? Products using them will keep their existing value.`)) return;
    try {
      await Promise.all(deletable.map(id => categoryAPI.delete(id)));
      toast.success(`${deletable.length} category/categories deleted`);
      setSelectedIds(new Set()); fetchCategories();
    } catch { toast.error('Some deletions failed'); }
  };
  const handleBulkSetActive = async (isActive) => {
    const targets = [...selectedIds].filter(id => !categories.find(c => c._id === id && c.isDefault));
    if (targets.length === 0) { toast.warning('No eligible categories selected'); return; }
    try {
      await Promise.all(targets.map(id => categoryAPI.update(id, { isActive })));
      toast.success(`${targets.length} ${isActive ? 'activated' : 'deactivated'}`);
      setSelectedIds(new Set()); fetchCategories();
    } catch { toast.error('Some updates failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🏷️ <span className="gradient-text">Manage Categories</span></h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>Total: {categories.length}</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#f0f4ff', borderRadius: 12, marginBottom: 14, border: '2px solid #c5cae9', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#3949ab' }}>{selectedIds.size} selected</span>
          <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }} onClick={() => handleBulkSetActive(true)}>✅ Activate</button>
          <button className="btn btn-sm" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082' }} onClick={() => handleBulkSetActive(false)}>⏸ Deactivate</button>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>🗑 Delete</button>
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedIds(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }} style={{ maxWidth: 320 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {CAT_COLS.map(col => (
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
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.filter(c => !c.isDefault).length > 0 && paginated.filter(c => !c.isDefault).every(c => selectedIds.has(c._id))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              <SortTh label="Name" field="name" {...sortProps} />
              {visibleCols['Description'] && <th>Description</th>}
              {visibleCols['Type'] && <SortTh label="Type" field="parent" {...sortProps} />}
              {visibleCols['Products'] && <SortTh label="Products" field="productCount" {...sortProps} />}
              {visibleCols['Status'] && <SortTh label="Status" field="isActive" {...sortProps} />}
              {visibleCols['Added'] && <SortTh label="Added" field="createdAt" {...sortProps} />}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No categories found.</td></tr>
            ) : paginated.map((cat, i) => (
              <tr key={cat._id} style={{ opacity: cat.isActive ? 1 : 0.55 }}>
                <td>{!cat.isDefault && <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={selectedIds.has(cat._id)} onChange={() => toggleSelect(cat._id)} />}</td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {cat.name}
                        {cat.isDefault && <span style={{ fontSize: 10, background: '#e3f2fd', color: '#1565c0', fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>🔒 Default</span>}
                      </div>
                    </div>
                  </div>
                </td>
                {visibleCols['Description'] && <td style={{ color: '#636e72', fontSize: 13, maxWidth: 220 }}>{cat.description || <span style={{ color: '#bdbdbd' }}>—</span>}</td>}
                {visibleCols['Type'] && (
                  <td>
                    {cat.parent
                      ? <span style={{ background: '#f3e5f5', color: '#6a1b9a', fontWeight: 600, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>↳ {cat.parent.name}</span>
                      : <span style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>Parent</span>
                    }
                  </td>
                )}
                {visibleCols['Products'] && (
                  <td>
                    <span style={{ fontWeight: 700, color: cat.productCount > 0 ? '#6c63ff' : '#9e9e9e' }}>{cat.productCount}</span>
                  </td>
                )}
                {visibleCols['Status'] && (
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={cat.isActive} onChange={() => toggleActive(cat)} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: cat.isActive ? '#2d3436' : '#9e9e9e' }}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                  </td>
                )}
                {visibleCols['Added'] && <td style={{ color: '#636e72', fontSize: 13 }}>{new Date(cat.createdAt).toLocaleDateString('en-IN')}</td>}
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(cat)}>Edit</button>
                    {!cat.isDefault && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat._id, cat.name)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />



      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 460, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700 }}>{editing ? '✏️ Edit Category' : '➕ New Category'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, marginBottom: 4 }}>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={{ textAlign: 'center', fontSize: 24 }} maxLength={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Skincare" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description (optional)" />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Category <span style={{ fontWeight: 400, color: '#9e9e9e', fontSize: 12 }}>(optional — leave blank for top-level)</span></label>
                <select className="form-select" value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })}>
                  <option value="">— Top-level category —</option>
                  {parentOptions.map(c => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
