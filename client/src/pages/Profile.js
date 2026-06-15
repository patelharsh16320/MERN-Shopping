import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, contactAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MILESTONES = [
  { day: 7, reward: '10% OFF', emoji: '🎁' },
  { day: 30, reward: '25% OFF', emoji: '👑' },
];

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
  const [myMessages, setMyMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState(null);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    contactAPI.getUserStats()
      .then(({ data }) => setUnreadMsgCount(data.unread || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'streak') return;
    authAPI.getStreak().then(({ data }) => setStreak(data)).catch(() => {});
  }, [tab]);

  useEffect(() => {
    if (tab !== 'messages') return;
    setMsgsLoading(true);
    contactAPI.getMine()
      .then(({ data }) => setMyMessages(data.contacts))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setMsgsLoading(false));
  }, [tab]);

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
              {[['profile', '👤', 'Profile Info'], ['addresses', '📍', 'My Addresses'], ['streak', '🔥', 'My Streak'], ['messages', '💬', 'My Messages']].map(([key, icon, label]) => (
                <div key={key} onClick={() => setTab(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 12, marginBottom: 4, background: tab === key ? '#e8f5e9' : 'transparent', color: tab === key ? 'var(--primary)' : 'var(--text)', fontWeight: tab === key ? 700 : 500, fontSize: 14, transition: 'all 0.2s' }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {key === 'messages' && unreadMsgCount > 0 && (
                    <span style={{ background: '#d63031', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                      {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                    </span>
                  )}
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
            {tab === 'streak' && (
              <div style={{ background: 'white', borderRadius: 24, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontWeight: 700, marginBottom: 28, fontSize: 22 }}>🔥 My Daily Streak</h2>

                {!streak ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>Loading streak...</div>
                ) : (() => {
                  const nextMilestone = MILESTONES.find(m => streak.current < m.day) || MILESTONES[MILESTONES.length - 1];
                  const progress = Math.min(100, (streak.current / nextMilestone.day) * 100);
                  const daysLeft = Math.max(0, nextMilestone.day - streak.current);
                  const weekPos = streak.current === 0 ? 0 : ((streak.current - 1) % 7) + 1;

                  return (
                    <>
                      {/* Stat cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
                        <div style={{ background: 'linear-gradient(135deg,#fff0f5,#fce4ec)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', border: '1px solid #f8bbd0' }}>
                          <div style={{ fontSize: 36 }}>🔥</div>
                          <div style={{ fontSize: 32, fontWeight: 800, color: '#c2185b', lineHeight: 1.1 }}>{streak.current}</div>
                          <div style={{ fontSize: 13, color: '#9e9e9e', marginTop: 4 }}>Current Streak</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg,#f3e5f5,#e8eaf6)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', border: '1px solid #e1bee7' }}>
                          <div style={{ fontSize: 36 }}>🏆</div>
                          <div style={{ fontSize: 32, fontWeight: 800, color: '#7b1fa2', lineHeight: 1.1 }}>{streak.longest}</div>
                          <div style={{ fontSize: 13, color: '#9e9e9e', marginTop: 4 }}>Longest Streak</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', border: '1px solid #c8e6c9' }}>
                          <div style={{ fontSize: 36 }}>{streak.checkedToday ? '✅' : '⏰'}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: streak.checkedToday ? '#2e7d32' : '#e65100', lineHeight: 1.3, marginTop: 4 }}>
                            {streak.checkedToday ? 'Checked In' : 'Not Yet Today'}
                          </div>
                          <div style={{ fontSize: 13, color: '#9e9e9e', marginTop: 4 }}>Today's Status</div>
                        </div>
                      </div>

                      {/* Week dots */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12 }}>This week</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {Array.from({ length: 7 }, (_, i) => {
                            const filled = i < weekPos;
                            return (
                              <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: filled ? 'linear-gradient(135deg,#c2185b,#e91e63)' : 'white', color: filled ? 'white' : '#bdbdbd', border: filled ? 'none' : '2px dashed #f8bbd0', transition: 'all 0.3s' }}>
                                {filled ? '✓' : i + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#9e9e9e', marginBottom: 6 }}>
                          <span>🎁 7 days = 10% OFF</span>
                          <span>👑 30 days = 25% OFF</span>
                        </div>
                        <div style={{ background: '#f5f5f5', borderRadius: 50, height: 10, overflow: 'hidden', border: '1px solid #f8bbd0' }}>
                          <div style={{ height: '100%', width: `${progress}%`, borderRadius: 50, background: 'linear-gradient(90deg,#c2185b,#f06292)', transition: 'width 0.6s ease' }} />
                        </div>
                        {daysLeft > 0 && (
                          <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 6 }}>
                            <strong style={{ color: '#c2185b' }}>{daysLeft} more days</strong> to unlock {nextMilestone.reward} {nextMilestone.emoji}
                          </div>
                        )}
                      </div>

                      {/* Earned coupons */}
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 14 }}>🎟️ My Streak Rewards</div>
                        {(!streak.earnedCoupons || streak.earnedCoupons.length === 0) ? (
                          <div style={{ padding: '24px', background: '#fafafa', borderRadius: 16, textAlign: 'center', color: '#9e9e9e', border: '1px dashed #e0e0e0' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>No rewards yet</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>Reach a 7-day streak to earn your first coupon!</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {streak.earnedCoupons.map((c, i) => {
                              const expired = new Date(c.expiresAt) < new Date();
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: expired ? '#fafafa' : 'linear-gradient(135deg,#fff0f5,#fce4ec)', border: `1px solid ${expired ? '#e0e0e0' : '#f8bbd0'}`, flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: 28 }}>{c.milestone >= 30 ? '👑' : '🎁'}</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>
                                      {c.milestone}-day milestone reward
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: expired ? '#9e9e9e' : '#c2185b', fontFamily: 'monospace', letterSpacing: 1 }}>
                                      {c.code}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 2 }}>
                                      {c.discountValue}% OFF · {expired ? 'Expired' : `Expires ${new Date(c.expiresAt).toLocaleDateString('en-IN')}`}
                                    </div>
                                  </div>
                                  {!expired && (
                                    <button
                                      onClick={() => navigator.clipboard.writeText(c.code).then(() => toast.info('Coupon copied! 📋', { autoClose: 1500 }))}
                                      style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#c2185b', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                      Copy 📋
                                    </button>
                                  )}
                                  {expired && <span style={{ fontSize: 12, color: '#bdbdbd', fontWeight: 600 }}>Expired</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {tab === 'messages' && (
              <div style={{ background: 'white', borderRadius: 24, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>💬 My Messages</h2>
                  {unreadMsgCount > 0 && (
                    <div style={{ background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: 12, padding: '8px 16px', fontSize: 13, color: '#e65100', fontWeight: 600 }}>
                      🔔 You have {unreadMsgCount} unread {unreadMsgCount === 1 ? 'reply' : 'replies'}
                    </div>
                  )}
                </div>

                {msgsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</div>
                ) : myMessages.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state-icon">💬</div>
                    <p>You haven't sent any messages yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {myMessages.map(msg => (
                      <div key={msg._id} style={{ border: `2px solid ${!msg.userRead && msg.replies?.length > 0 ? '#6c63ff' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden' }}>
                        {/* Message header */}
                        <div
                          onClick={() => {
                            const isOpening = expandedMsg !== msg._id;
                            setExpandedMsg(isOpening ? msg._id : null);
                            if (isOpening && !msg.userRead && msg.replies?.length > 0) {
                              contactAPI.markUserRead(msg._id).catch(() => {});
                              setMyMessages(prev => prev.map(m => m._id === msg._id ? { ...m, userRead: true } : m));
                              setUnreadMsgCount(c => Math.max(0, c - 1));
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', background: expandedMsg === msg._id ? '#f8f7ff' : 'white' }}>
                          {/* Avatar */}
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{msg.subject}</div>
                            <div style={{ fontSize: 12, color: '#636e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, color: '#9e9e9e' }}>{new Date(msg.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                            {msg.replies?.length > 0 && (
                              <span style={{ background: !msg.userRead ? '#e8f0ff' : '#e8f5e9', color: !msg.userRead ? '#6c63ff' : '#558b2f', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                {!msg.userRead ? '🔵 New reply' : `${msg.replies.length} ${msg.replies.length === 1 ? 'reply' : 'replies'}`}
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#9e9e9e', fontSize: 12, marginLeft: 8 }}>{expandedMsg === msg._id ? '▲' : '▼'}</span>
                        </div>

                        {/* Expanded body */}
                        {expandedMsg === msg._id && (
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                            {/* User's original message */}
                            <div style={{ marginTop: 16 }}>
                              <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Your Message</div>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                  {user.name?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ background: '#f5f5f5', borderRadius: '0 12px 12px 12px', padding: '12px 16px', fontSize: 14, lineHeight: 1.7, color: '#2d3436', flex: 1, whiteSpace: 'pre-wrap' }}>
                                  {msg.message}
                                </div>
                              </div>
                            </div>

                            {/* Admin replies */}
                            {msg.replies?.length > 0 ? (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Admin Replies</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {msg.replies.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                      <div style={{ background: '#f0f0ff', borderRadius: '12px 0 12px 12px', padding: '12px 16px', fontSize: 14, lineHeight: 1.7, color: '#2d3436', maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                                        {r.message}
                                        <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 4 }}>
                                          {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                      </div>
                                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#fd79a8,#6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                        🌸
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbf0', borderRadius: 12, fontSize: 13, color: '#9e9e9e', border: '1px dashed #f0e0a0' }}>
                                ⏳ Awaiting admin reply...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
