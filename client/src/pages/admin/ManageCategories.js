import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { categoryAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', description: '', icon: '🏷️', parent: '' };

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data);
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const topLevel = useMemo(() => categories.filter(c => !c.parent), [categories]);
  const parentOptions = useMemo(() => topLevel.filter(c => c._id !== editing), [topLevel, editing]);

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

  // Group: parent categories first, then subcategories grouped under their parent
  const grouped = useMemo(() => {
    const parents = categories.filter(c => !c.parent);
    const result = [];
    parents.forEach(p => {
      result.push({ ...p, _isParent: true });
      categories.filter(c => c.parent?._id === p._id || c.parent === p._id).forEach(child => {
        result.push({ ...child, _isParent: false });
      });
    });
    return result;
  }, [categories]);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏷️ <span className="gradient-text">Manage Categories</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9e9e9e' }}>Loading...</div>
        ) : grouped.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
            <p style={{ color: '#9e9e9e' }}>No categories yet. Add your first one!</p>
          </div>
        ) : grouped.map(cat => (
          <div key={cat._id} style={{
            background: 'white', borderRadius: 20, padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            border: `2px solid ${cat.isDefault ? '#e3f2fd' : cat.isActive ? '#e8f5e9' : '#f5f5f5'}`,
            opacity: cat.isActive ? 1 : 0.6,
            marginLeft: cat._isParent ? 0 : 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{cat.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                    {!cat.isActive && <span style={{ fontSize: 11, color: '#d63031', fontWeight: 600 }}>Inactive</span>}
                    {cat.isDefault && <span style={{ fontSize: 11, background: '#e3f2fd', color: '#1565c0', fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>🔒 Default</span>}
                    {!cat._isParent && cat.parent && <span style={{ fontSize: 11, background: '#f3e5f5', color: '#6a1b9a', fontWeight: 600, padding: '1px 7px', borderRadius: 10 }}>↳ {cat.parent.name}</span>}
                    {cat._isParent && !cat.parent && categories.some(c => c.parent?._id === cat._id || c.parent === cat._id) && (
                      <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2e7d32', fontWeight: 600, padding: '1px 7px', borderRadius: 10 }}>Parent</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(cat)}>✏️</button>
                {!cat.isDefault && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat._id, cat.name)}>🗑</button>
                )}
              </div>
            </div>
            {cat.description && <p style={{ fontSize: 13, color: '#636e72', marginBottom: 16, lineHeight: 1.5 }}>{cat.description}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9e9e9e' }}>
                {cat.productCount > 0 ? `${cat.productCount} product${cat.productCount !== 1 ? 's' : ''}` : 'No products'}
                {' · '}Added {new Date(cat.createdAt).toLocaleDateString('en-IN')}
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: cat.isActive ? '#2d3436' : '#9e9e9e' }}>
                <input type="checkbox" checked={cat.isActive} onChange={() => toggleActive(cat)} />
                Active
              </label>
            </div>
          </div>
        ))}
      </div>

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
