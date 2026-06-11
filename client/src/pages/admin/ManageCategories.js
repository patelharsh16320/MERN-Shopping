import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { categoryAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import ImportModal from './ImportModal';

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
  const [importModal, setImportModal] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => Object.fromEntries(CAT_COLS.map(c => [c, true])));
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

  const toggleCol = (col) => setVisibleCols(v => ({ ...v, [col]: !v[col] }));

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

  const handleExport = async (format) => {
    try {
      const { data } = await categoryAPI.exportAll(format);
      const isCSV = format === 'csv';
      const blob = new Blob([isCSV ? data : JSON.stringify(data, null, 2)], { type: isCSV ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `categories-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${isCSV ? '' : data.length + ' '}categories as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (items, duplicateAction) => {
    const { data } = await categoryAPI.importAll(items, duplicateAction);
    fetchCategories();
    return data;
  };

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

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏷️ <span className="gradient-text">Manage Categories</span></h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>Total: {categories.length}</div>
          <button className="btn btn-secondary" onClick={() => handleExport('json')} style={{ fontWeight: 600 }}>📤 JSON</button>
          <button className="btn btn-secondary" onClick={() => handleExport('csv')} style={{ fontWeight: 600 }}>📤 CSV</button>
          <button className="btn btn-secondary" onClick={() => setImportModal(true)} style={{ fontWeight: 600 }}>📥 Import</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320 }} />
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
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No categories found.</td></tr>
            ) : paginated.map((cat, i) => (
              <tr key={cat._id} style={{ opacity: cat.isActive ? 1 : 0.55 }}>
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

      {importModal && (
        <ImportModal entityName="Categories" onImport={handleImport} onClose={() => setImportModal(false)} />
      )}

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
