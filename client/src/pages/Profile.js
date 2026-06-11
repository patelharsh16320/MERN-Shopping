import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const emptyAddress = { label: 'Home', street: '', city: '', state: '', zip: '', country: 'India', isDefault: false };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', password: '',
  });
  const [addresses, setAddresses] = useState(
    user?.addresses?.length ? user.addresses : (user?.address?.street ? [{ ...user.address, label: 'Home', isDefault: true }] : [])
  );
  const [addingAddr, setAddingAddr] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [newAddr, setNewAddr] = useState(emptyAddress);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  if (!user) { navigate('/login'); return null; }

  const avatarText = user.name?.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile({
        name: form.name, phone: form.phone,
        password: form.password || undefined,
        addresses,
        address: addresses.find(a => a.isDefault) || addresses[0] || {},
      });
      updateUser(data);
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '' }));
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    setLoading(false);
  };

  const setDefault = (idx) => {
    setAddresses(prev => prev.map((a, i) => ({ ...a, isDefault: i === idx })));
  };

  const removeAddress = (idx) => {
    setAddresses(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (prev[idx].isDefault && updated.length > 0) updated[0].isDefault = true;
      return updated;
    });
  };

  const saveNewAddress = () => {
    if (!newAddr.street || !newAddr.city) { toast.warning('Street and city are required'); return; }
    if (editingIdx !== null) {
      setAddresses(prev => prev.map((a, i) => i === editingIdx ? { ...newAddr } : a));
      setEditingIdx(null);
    } else {
      const isFirst = addresses.length === 0;
      setAddresses(prev => [...prev, { ...newAddr, isDefault: isFirst }]);
    }
    setNewAddr(emptyAddress);
    setAddingAddr(false);
  };

  const startEdit = (idx) => {
    setNewAddr({ ...addresses[idx] });
    setEditingIdx(idx);
    setAddingAddr(true);
  };

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">👤 My Profile</h1>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="layout-sidebar">
          {/* Sidebar */}
          <div className="animate-left">
            <div style={{ background: 'white', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: 'var(--shadow)', marginBottom: 20, border: '1px solid var(--border)' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white', margin: '0 auto 16px' }}>
                {avatarText}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{user.name}</div>
              <div style={{ color: '#558b2f', fontSize: 14, marginBottom: 12 }}>{user.email}</div>
              <span className={`badge badge-${user.role}`}>{user.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}</span>
              {user.role === 'admin' && (
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => navigate('/admin')}>
                  Go to Dashboard →
                </button>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: 24, padding: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              {[['profile', '👤', 'Profile Info'], ['addresses', '📍', 'My Addresses']].map(([key, icon, label]) => (
                <div key={key} onClick={() => setTab(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 12, marginBottom: 4, background: tab === key ? '#e8f5e9' : 'transparent', color: tab === key ? 'var(--primary)' : 'var(--text)', fontWeight: tab === key ? 700 : 500, fontSize: 14, transition: 'all 0.2s' }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
              <div className="divider" style={{ margin: '8px 0' }} />
              {[['📦', 'My Orders', '/orders'], ['🧾', 'My Invoices', '/invoices'], ['🤍', 'Wishlist', '/wishlist'], ['🛒', 'Continue Shopping', '/products']].map(([icon, label, path]) => (
                <div key={path} onClick={() => navigate(path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 12, marginBottom: 4, fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e8f5e9'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>
                  <span>{icon}</span> {label} <span style={{ marginLeft: 'auto' }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="animate-right">
            {tab === 'profile' && (
              <div style={{ background: 'white', borderRadius: 24, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontWeight: 700, marginBottom: 28, fontSize: 22 }}>Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email <span style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 400 }}>(cannot be changed)</span></label>
                      <input className="form-input" type="email" value={form.email} readOnly style={{ background: '#f5f5f5', color: '#9e9e9e', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password (optional)</label>
                      <input className="form-input" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'addresses' && (
              <div style={{ background: 'white', borderRadius: 24, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 22 }}>📍 My Addresses</h2>
                  {!addingAddr && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setNewAddr(emptyAddress); setEditingIdx(null); setAddingAddr(true); }}>
                      + Add Address
                    </button>
                  )}
                </div>

                {addresses.length === 0 && !addingAddr && (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state-icon">📍</div>
                    <p>No addresses saved yet</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setAddingAddr(true)}>Add Your First Address</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: addresses.length > 0 && addingAddr ? 24 : 0 }}>
                  {addresses.map((addr, idx) => (
                    <div key={idx} className={`address-card ${addr.isDefault ? 'default-addr' : ''}`}>
                      {addr.isDefault && (
                        <span className="badge badge-shipped" style={{ position: 'absolute', top: 16, right: 16, fontSize: 11 }}>✓ Default</span>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>
                          {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📌'} {addr.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: '#558b2f', lineHeight: 1.7 }}>
                        {addr.street}<br />
                        {addr.city}, {addr.state} - {addr.zip}<br />
                        {addr.country}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                        {!addr.isDefault && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setDefault(idx)}>Set Default</button>
                        )}
                        <button className="btn btn-sm" style={{ background: '#e8f5e9', color: 'var(--primary)' }} onClick={() => startEdit(idx)}>✏️ Edit</button>
                        <button className="btn btn-sm" style={{ background: '#ffebee', color: '#c62828' }} onClick={() => removeAddress(idx)}>🗑 Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

{addingAddr && (
                  <div style={{ background: '#f1f8e9', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 20, fontSize: 16 }}>
                      {editingIdx !== null ? '✏️ Edit Address' : '+ New Address'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Label</label>
                        <select className="form-select" value={newAddr.label} onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}>
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Country</label>
                        <input className="form-input" value={newAddr.country} onChange={e => setNewAddr({ ...newAddr, country: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input className="form-input" placeholder="123 Main Street, Apt 4B" value={newAddr.street} onChange={e => setNewAddr({ ...newAddr, street: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input className="form-input" placeholder="Mumbai" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input className="form-input" placeholder="Maharashtra" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ZIP Code</label>
                        <input className="form-input" placeholder="400001" value={newAddr.zip} onChange={e => setNewAddr({ ...newAddr, zip: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-primary" onClick={saveNewAddress}>
                        {editingIdx !== null ? '✓ Update Address' : '+ Save Address'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setAddingAddr(false); setEditingIdx(null); setNewAddr(emptyAddress); }}>Cancel</button>
                    </div>
                  </div>
                )}

                {addresses.length > 0 && (
                  <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? '⏳ Saving...' : '💾 Save All Addresses'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
