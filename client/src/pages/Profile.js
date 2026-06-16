import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, contactAPI, loyaltyAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

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
  const [loyalty, setLoyalty] = useState(null);

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
    if (tab !== 'loyalty') return;
    loyaltyAPI.getMyLoyalty().then(({ data }) => setLoyalty(data)).catch(() => {});
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

      <div className="container prof-page-body">
        <div className="layout-sidebar">
          {/* Sidebar */}
          <div className="animate-left">
            <div className="prof-panel prof-sidebar-card">
              <div className="prof-avatar-lg">
                {avatarText}
              </div>
              <div className="prof-user-name">{user.name}</div>
              <div className="prof-user-email">{user.email}</div>
              <span className={`badge badge-${user.role}`}>{user.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}</span>
              {user.role === 'admin' && (
                <button className="btn btn-primary prof-admin-btn" onClick={() => navigate('/admin')}>
                  Go to Dashboard →
                </button>
              )}
            </div>

            <div className="prof-panel prof-nav-card">
              {[['profile', '👤', 'Profile Info'], ['addresses', '📍', 'My Addresses'], ['streak', '🔥', 'My Streak'], ['loyalty', '⭐', 'Loyalty Points'], ['messages', '💬', 'My Messages']].map(([key, icon, label]) => (
                <div key={key} onClick={() => setTab(key)}
                  className={`prof-nav-item ${tab === key ? 'active' : ''}`}>
                  <span>{icon}</span>
                  <span className="prof-nav-label">{label}</span>
                  {key === 'messages' && unreadMsgCount > 0 && (
                    <span className="prof-unread-badge">
                      {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                    </span>
                  )}
                </div>
              ))}
              <div className="divider prof-divider-tight" />
              {[['📦', 'My Orders', '/orders'], ['🧾', 'My Invoices', '/invoices'], ['🤍', 'Wishlist', '/wishlist'], ['🎫', 'Support Tickets', '/support'], ['🛒', 'Continue Shopping', '/products']].map(([icon, label, path]) => (
                <div key={path} onClick={() => navigate(path)}
                  className="prof-quick-link">
                  <span>{icon}</span> {label} <span className="prof-quick-link-arrow">→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="animate-right">
            {tab === 'profile' && (
              <div className="prof-panel prof-tab-panel">
                <h2 className="prof-tab-heading spaced">Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                  <div className="prof-form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email <span className="prof-email-hint">(cannot be changed)</span></label>
                      <input className="form-input prof-readonly-input" type="email" value={form.email} readOnly />
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
                  <button className="btn btn-primary btn-lg prof-save-btn" type="submit" disabled={loading}>
                    {loading ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'addresses' && (
              <div className="prof-panel prof-tab-panel">
                <div className="prof-addr-header">
                  <h2 className="prof-tab-heading">📍 My Addresses</h2>
                  {!addingAddr && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setNewAddr(emptyAddress); setEditingIdx(null); setAddingAddr(true); }}>
                      + Add Address
                    </button>
                  )}
                </div>

                {addresses.length === 0 && !addingAddr && (
                  <div className="empty-state prof-empty-tight">
                    <div className="empty-state-icon">📍</div>
                    <p>No addresses saved yet</p>
                    <button className="btn btn-primary prof-empty-cta" onClick={() => setAddingAddr(true)}>Add Your First Address</button>
                  </div>
                )}

                <div className={`prof-addr-list ${addresses.length > 0 && addingAddr ? 'with-form' : ''}`}>
                  {addresses.map((addr, idx) => (
                    <div key={idx} className={`address-card ${addr.isDefault ? 'default-addr' : ''}`}>
                      {addr.isDefault && (
                        <span className="badge badge-shipped prof-default-badge">✓ Default</span>
                      )}
                      <div className="prof-addr-label-row">
                        <span className="prof-addr-label-text">
                          {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📌'} {addr.label}
                        </span>
                      </div>
                      <div className="prof-addr-body">
                        {addr.street}<br />
                        {addr.city}, {addr.state} - {addr.zip}<br />
                        {addr.country}
                      </div>
                      <div className="prof-addr-actions">
                        {!addr.isDefault && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setDefault(idx)}>Set Default</button>
                        )}
                        <button className="btn btn-sm prof-edit-btn" onClick={() => startEdit(idx)}>✏️ Edit</button>
                        <button className="btn btn-sm prof-remove-btn" onClick={() => removeAddress(idx)}>🗑 Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                {addingAddr && (
                  <div className="prof-add-form-box">
                    <h3 className="prof-add-form-heading">
                      {editingIdx !== null ? '✏️ Edit Address' : '+ New Address'}
                    </h3>
                    <div className="prof-form-grid-2">
                      <div className="form-group prof-fg-tight">
                        <label className="form-label">Label</label>
                        <select className="form-select" value={newAddr.label} onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}>
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="form-group prof-fg-tight">
                        <label className="form-label">Country</label>
                        <input className="form-input" value={newAddr.country} onChange={e => setNewAddr({ ...newAddr, country: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input className="form-input" placeholder="123 Main Street, Apt 4B" value={newAddr.street} onChange={e => setNewAddr({ ...newAddr, street: e.target.value })} />
                    </div>
                    <div className="prof-form-grid-3">
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
                    <div className="prof-form-actions">
                      <button className="btn btn-primary" onClick={saveNewAddress}>
                        {editingIdx !== null ? '✓ Update Address' : '+ Save Address'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setAddingAddr(false); setEditingIdx(null); setNewAddr(emptyAddress); }}>Cancel</button>
                    </div>
                  </div>
                )}

                {addresses.length > 0 && (
                  <button className="btn btn-primary btn-lg prof-save-all-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? '⏳ Saving...' : '💾 Save All Addresses'}
                  </button>
                )}
              </div>
            )}
            {tab === 'streak' && (
              <div className="prof-panel prof-tab-panel">
                <h2 className="prof-tab-heading spaced">🔥 My Daily Streak</h2>

                {!streak ? (
                  <div className="prof-loading-text">Loading streak...</div>
                ) : (() => {
                  const nextMilestone = MILESTONES.find(m => streak.current < m.day) || MILESTONES[MILESTONES.length - 1];
                  const progress = Math.min(100, (streak.current / nextMilestone.day) * 100);
                  const daysLeft = Math.max(0, nextMilestone.day - streak.current);
                  const weekPos = streak.current === 0 ? 0 : ((streak.current - 1) % 7) + 1;

                  return (
                    <>
                      {/* Stat cards */}
                      <div className="prof-streak-stats-grid">
                        <div className="prof-streak-stat cur">
                          <div className="prof-streak-stat-icon">🔥</div>
                          <div className="prof-streak-stat-value cur">{streak.current}</div>
                          <div className="prof-streak-stat-label">Current Streak</div>
                        </div>
                        <div className="prof-streak-stat longest">
                          <div className="prof-streak-stat-icon">🏆</div>
                          <div className="prof-streak-stat-value longest">{streak.longest}</div>
                          <div className="prof-streak-stat-label">Longest Streak</div>
                        </div>
                        <div className="prof-streak-stat today">
                          <div className="prof-streak-stat-icon">{streak.checkedToday ? '✅' : '⏰'}</div>
                          <div className={`prof-today-status ${streak.checkedToday ? 'checked' : 'notyet'}`}>
                            {streak.checkedToday ? 'Checked In' : 'Not Yet Today'}
                          </div>
                          <div className="prof-streak-stat-label">Today's Status</div>
                        </div>
                      </div>

                      {/* Week dots */}
                      <div className="prof-week-section">
                        <div className="prof-week-heading">This week</div>
                        <div className="prof-week-row">
                          {Array.from({ length: 7 }, (_, i) => {
                            const filled = i < weekPos;
                            return (
                              <div key={i} className={`prof-week-dot ${filled ? 'filled' : ''}`}>
                                {filled ? '✓' : i + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="prof-progress-section">
                        <div className="prof-progress-labels">
                          <span>🎁 7 days = 10% OFF</span>
                          <span>👑 30 days = 25% OFF</span>
                        </div>
                        <div className="prof-progress-track">
                          <div className="prof-progress-fill" style={{ '--progress': `${progress}%` }} />
                        </div>
                        {daysLeft > 0 && (
                          <div className="prof-days-left-text">
                            <strong className="prof-days-left-strong">{daysLeft} more days</strong> to unlock {nextMilestone.reward} {nextMilestone.emoji}
                          </div>
                        )}
                      </div>

                      {/* Earned coupons */}
                      <div>
                        <div className="prof-rewards-heading">🎟️ My Streak Rewards</div>
                        {(!streak.earnedCoupons || streak.earnedCoupons.length === 0) ? (
                          <div className="prof-rewards-empty">
                            <div className="prof-rewards-empty-icon">🎁</div>
                            <div className="prof-rewards-empty-title">No rewards yet</div>
                            <div className="prof-rewards-empty-sub">Reach a 7-day streak to earn your first coupon!</div>
                          </div>
                        ) : (
                          <div className="prof-rewards-list">
                            {streak.earnedCoupons.map((c, i) => {
                              const expired = new Date(c.expiresAt) < new Date();
                              return (
                                <div key={i} className={`prof-reward-card ${expired ? 'expired' : ''}`}>
                                  <div className="prof-reward-icon">{c.milestone >= 30 ? '👑' : '🎁'}</div>
                                  <div className="prof-reward-info">
                                    <div className="prof-reward-milestone">
                                      {c.milestone}-day milestone reward
                                    </div>
                                    <div className={`prof-reward-code ${expired ? 'expired' : ''}`}>
                                      {c.code}
                                    </div>
                                    <div className="prof-reward-detail">
                                      {c.discountValue}% OFF · {expired ? 'Expired' : `Expires ${new Date(c.expiresAt).toLocaleDateString('en-IN')}`}
                                    </div>
                                  </div>
                                  {!expired && (
                                    <button
                                      onClick={() => navigator.clipboard.writeText(c.code).then(() => toast.info('Coupon copied! 📋', { autoClose: 1500 }))}
                                      className="prof-reward-copy-btn">
                                      Copy 📋
                                    </button>
                                  )}
                                  {expired && <span className="prof-reward-expired-label">Expired</span>}
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

            {tab === 'loyalty' && (
              <div className="prof-panel prof-tab-panel">
                <h2 className="prof-tab-heading spaced">⭐ My Loyalty Points</h2>
                {!loyalty ? (
                  <div className="prof-loading-text-alt">Loading...</div>
                ) : (() => {
                  const nextTier   = { Bronze: 'Silver', Silver: 'Gold', Gold: 'Platinum', Platinum: null };
                  const thresholds = loyalty.tierThresholds || { Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000 };
                  const nt         = nextTier[loyalty.tier];
                  const progress   = nt ? Math.min(100, ((loyalty.totalEarned - thresholds[loyalty.tier]) / (thresholds[nt] - thresholds[loyalty.tier])) * 100) : 100;
                  const tierClass  = `prof-tier-${loyalty.tier.toLowerCase()}`;
                  const gradClass  = nt ? `prof-tier-grad-${loyalty.tier.toLowerCase()}-${nt.toLowerCase()}` : '';

                  return (
                    <>
                      {/* Tier card */}
                      <div className={`prof-tier-card ${tierClass}`}>
                        <div className="prof-tier-badge">
                          {loyalty.tier === 'Bronze' ? '🥉' : loyalty.tier === 'Silver' ? '🥈' : loyalty.tier === 'Gold' ? '🥇' : '💎'}
                        </div>
                        <div className="prof-tier-info">
                          <div className="prof-tier-label">Your Tier</div>
                          <div className="prof-tier-name">{loyalty.tier}</div>
                          <div className="prof-tier-earned">{loyalty.totalEarned.toLocaleString()} points earned lifetime</div>
                          {nt && (
                            <div className="prof-next-tier-wrap">
                              <div className="prof-next-tier-labels">
                                <span>{loyalty.tier}</span><span>{nt} ({(thresholds[nt] - loyalty.totalEarned).toLocaleString()} pts away)</span>
                              </div>
                              <div className="prof-next-tier-track">
                                <div className={`prof-next-tier-fill ${gradClass}`} style={{ '--progress': `${progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="prof-points-display">
                          <div className="prof-points-value">{loyalty.points.toLocaleString()}</div>
                          <div className="prof-points-label">Available Points</div>
                          <div className="prof-points-worth">≈ ₹{Math.floor(loyalty.points * (loyalty.pointsToRupee || 0.5))} value</div>
                        </div>
                      </div>

                      {/* How to earn / redeem */}
                      <div className="prof-info-grid">
                        <div className="prof-earn-box">
                          <div className="prof-info-box-title">🎯 How to Earn</div>
                          <div className="prof-info-box-body">
                            • Every ₹10 spent = <strong>1 point</strong><br />
                            • Daily login streak milestones<br />
                            • Special promotional events
                          </div>
                        </div>
                        <div className="prof-redeem-box">
                          <div className="prof-info-box-title">💸 Redemption Rate</div>
                          <div className="prof-info-box-body">
                            • <strong>1 point = ₹{loyalty.pointsToRupee || 0.5}</strong> off<br />
                            • Use at checkout<br />
                            • No minimum points required
                          </div>
                        </div>
                      </div>

                      {/* Tier benefits */}
                      <div className="prof-benefits-section">
                        <div className="prof-benefits-heading">🏆 Tier Benefits</div>
                        <div className="prof-benefits-grid">
                          {Object.entries({ Bronze: ['Free shipping >₹999', 'Basic support'], Silver: ['Free shipping >₹499', 'Priority support', '5% bonus points'], Gold: ['Free shipping always', 'VIP support', '10% bonus points', 'Early sale access'], Platinum: ['Free shipping always', 'Dedicated support', '20% bonus points', 'Exclusive launches', 'Birthday rewards'] }).map(([tier, perks]) => (
                            <div key={tier} className={`prof-benefit-card prof-tier-${tier.toLowerCase()} ${tier === loyalty.tier ? 'active' : ''}`}>
                              <div className="prof-benefit-title">{tier === 'Bronze' ? '🥉' : tier === 'Silver' ? '🥈' : tier === 'Gold' ? '🥇' : '💎'} {tier}</div>
                              {perks.map(p => <div key={p} className="prof-benefit-perk">✓ {p}</div>)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Points history */}
                      {loyalty.history && loyalty.history.length > 0 && (
                        <div className="prof-history-section">
                          <div className="prof-benefits-heading">📋 Points History</div>
                          <div className="prof-history-list">
                            {loyalty.history.map((h, i) => (
                              <div key={i} className="prof-history-row">
                                <div>
                                  <div className="prof-history-reason">{h.reason}</div>
                                  <div className="prof-history-date">{new Date(h.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                                </div>
                                <div className={`prof-history-points ${h.type === 'earned' ? 'earned' : 'spent'}`}>
                                  {h.type === 'earned' ? '+' : ''}{h.points} pts
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {tab === 'messages' && (
              <div className="prof-panel prof-tab-panel">
                <div className="prof-msg-header">
                  <h2 className="prof-tab-heading prof-msg-heading">💬 My Messages</h2>
                  {unreadMsgCount > 0 && (
                    <div className="prof-unread-notice">
                      🔔 You have {unreadMsgCount} unread {unreadMsgCount === 1 ? 'reply' : 'replies'}
                    </div>
                  )}
                </div>

                {msgsLoading ? (
                  <div className="prof-loading-text-alt">Loading...</div>
                ) : myMessages.length === 0 ? (
                  <div className="empty-state prof-empty-tight">
                    <div className="empty-state-icon">💬</div>
                    <p>You haven't sent any messages yet.</p>
                  </div>
                ) : (
                  <div className="prof-msg-list">
                    {myMessages.map(msg => (
                      <div key={msg._id} className={`prof-msg-card ${!msg.userRead && msg.replies?.length > 0 ? 'unread' : ''}`}>
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
                          className={`prof-msg-card-header ${expandedMsg === msg._id ? 'expanded' : ''}`}>
                          {/* Avatar */}
                          <div className="prof-msg-avatar">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="prof-msg-subject-wrap">
                            <div className="prof-msg-subject">{msg.subject}</div>
                            <div className="prof-msg-preview">{msg.message}</div>
                          </div>
                          <div className="prof-msg-meta-col">
                            <div className="prof-msg-date">{new Date(msg.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                            {msg.replies?.length > 0 && (
                              <span className={`prof-reply-badge ${!msg.userRead ? 'new' : 'replied'}`}>
                                {!msg.userRead ? '🔵 New reply' : `${msg.replies.length} ${msg.replies.length === 1 ? 'reply' : 'replies'}`}
                              </span>
                            )}
                          </div>
                          <span className="prof-expand-arrow">{expandedMsg === msg._id ? '▲' : '▼'}</span>
                        </div>

                        {/* Expanded body */}
                        {expandedMsg === msg._id && (
                          <div className="prof-msg-body">
                            {/* User's original message */}
                            <div className="prof-orig-msg-wrap">
                              <div className="prof-msg-section-label">Your Message</div>
                              <div className="prof-msg-row">
                                <div className="prof-msg-avatar-sm">
                                  {user.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="prof-bubble-user">
                                  {msg.message}
                                </div>
                              </div>
                            </div>

                            {/* Admin replies */}
                            {msg.replies?.length > 0 ? (
                              <div className="prof-replies-wrap">
                                <div className="prof-msg-section-label">Admin Replies</div>
                                <div className="prof-replies-list">
                                  {msg.replies.map((r, i) => (
                                    <div key={i} className="prof-reply-row">
                                      <div className="prof-bubble-admin">
                                        {r.message}
                                        <div className="prof-bubble-time">
                                          {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                      </div>
                                      <div className="prof-msg-avatar-sm-admin">
                                        🌸
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="prof-awaiting-box">
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
