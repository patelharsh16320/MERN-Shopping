import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { couponAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = { code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUsage: '', expiresAt: '', isActive: true };

const PAGE_SIZE = 10;

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

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await couponAPI.getAll();
      setCoupons(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter(c => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount || ''),
      maxUsage: String(c.maxUsage || ''),
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) return toast.error('Code and value are required');
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxUsage: parseInt(form.maxUsage) || 0,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };
      if (editing) {
        await couponAPI.update(editing._id, payload);
        toast.success('Coupon updated!');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created!');
      }
      setModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try { await couponAPI.delete(id); toast.success('Coupon deleted!'); fetchCoupons(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (c) => {
    try {
      await couponAPI.update(c._id, { isActive: !c.isActive });
      toast.success(c.isActive ? 'Coupon deactivated' : 'Coupon activated');
      fetchCoupons();
    } catch { toast.error('Update failed'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`Copied: ${code}`));
  };

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.map(c => c._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} coupon(s)?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => couponAPI.delete(id)));
      toast.success(`${selectedIds.size} coupon(s) deleted`);
      setSelectedIds(new Set()); fetchCoupons();
    } catch { toast.error('Some deletions failed'); }
  };

  const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🎟️ <span className="gradient-text">Manage Coupons</span></h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Coupon</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search by code..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }}
          style={{ maxWidth: 280 }} />
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
          {search ? `${filtered.length} / ${coupons.length}` : coupons.length} coupons
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fff0f0', borderRadius: 12, marginBottom: 14, border: '2px solid #ffcccc', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828' }}>{selectedIds.size} selected</span>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>🗑 Delete Selected</button>
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedIds(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.length > 0 && paginated.every(c => selectedIds.has(c._id))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No coupons found. Create your first coupon!</td></tr>
            ) : paginated.map((c, i) => (
              <tr key={c._id} style={{ opacity: !c.isActive || isExpired(c) ? 0.6 : 1 }}>
                <td><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#6c63ff', background: '#f0f0ff', padding: '3px 10px', borderRadius: 8, letterSpacing: 1 }}>{c.code}</span>
                    <button onClick={() => copyCode(c.code)} title="Copy code"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }}>📋</button>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: c.discountType === 'percentage' ? '#6c63ff' : '#00b894' }}>
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                  </span>
                </td>
                <td style={{ color: '#636e72', fontSize: 13 }}>{c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : '—'}</td>
                <td style={{ fontSize: 13 }}>
                  <span style={{ color: c.maxUsage > 0 && c.usageCount >= c.maxUsage ? '#d63031' : '#636e72' }}>
                    {c.usageCount}{c.maxUsage > 0 ? ` / ${c.maxUsage}` : ' / ∞'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: isExpired(c) ? '#d63031' : '#636e72' }}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}
                  {isExpired(c) && <div style={{ fontSize: 10, color: '#d63031', fontWeight: 700 }}>EXPIRED</div>}
                </td>
                <td>
                  <button onClick={() => toggleActive(c)}
                    style={{ border: 'none', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: c.isActive ? '#e8f5e9' : '#fce4e4', color: c.isActive ? '#00b894' : '#d63031' }}>
                    {c.isActive ? '✅ Active' : '❌ Off'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id, c.code)}>Del</button>
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
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 520, animation: 'zoomIn 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700 }}>{editing ? '✏️ Edit Coupon' : '🎟️ Create Coupon'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="e.g. SAVE20" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    style={{ flex: 1, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }} required />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={generateCode}>🎲 Random</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}</label>
                  <input className="form-input" type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                    value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Min Order Amount (₹)</label>
                  <input className="form-input" type="number" min="0" placeholder="0 = no minimum"
                    value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Usage</label>
                  <input className="form-input" type="number" min="0" placeholder="0 = unlimited"
                    value={form.maxUsage} onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date (optional)</label>
                <input className="form-input" type="date" value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: '#6c63ff' }} />
                  Active (users can apply this coupon)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? '💾 Update Coupon' : '🎟️ Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
