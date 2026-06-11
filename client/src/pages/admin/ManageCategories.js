import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { categoryAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', description: '', icon: '🏷️' };

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

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (cat) => { setEditing(cat._id); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🏷️' }); setModal(true); };

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
    catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (cat) => {
    try {
      await categoryAPI.update(cat._id, { isActive: !cat.isActive });
      fetchCategories();
    } catch { toast.error('Update failed'); }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏷️ <span className="gradient-text">Manage Categories</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9e9e9e' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
            <p style={{ color: '#9e9e9e' }}>No categories yet. Add your first one!</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat._id} style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${cat.isActive ? '#e8f5e9' : '#f5f5f5'}`, opacity: cat.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{cat.name}</div>
                  {!cat.isActive && <span style={{ fontSize: 11, color: '#d63031', fontWeight: 600 }}>Inactive</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(cat)}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat._id, cat.name)}>🗑</button>
              </div>
            </div>
            {cat.description && <p style={{ fontSize: 13, color: '#636e72', marginBottom: 16, lineHeight: 1.5 }}>{cat.description}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9e9e9e' }}>Added {new Date(cat.createdAt).toLocaleDateString('en-IN')}</span>
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
