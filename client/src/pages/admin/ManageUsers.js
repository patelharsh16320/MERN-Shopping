import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { userAPI, addressAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const USER_COLS = ['Email', 'Phone', 'Role', 'Status', 'Addresses', 'Joined'];
const PAGE_SIZE = 10;

const EMPTY_ADDR = { label: 'Home', street: '', city: '', state: '', zip: '', country: 'India', isDefault: false };

function SortTh({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
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

/* ── Address Management Modal ── */
function AddressModal({ user, onClose }) {
  const [addresses, setAddresses]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editAddr, setEditAddr]     = useState(null);  // null=list, obj=edit/new
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await addressAPI.getByUser(user._id);
      setAddresses(data);
    } catch { toast.error('Failed to load addresses'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user._id]); // eslint-disable-line

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editAddr._id) {
        await addressAPI.update(editAddr._id, editAddr);
        toast.success('Address updated');
      } else {
        await addressAPI.create(user._id, editAddr);
        toast.success('Address added');
      }
      setEditAddr(null);
      await load();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressAPI.remove(id);
      toast.success('Address deleted');
      await load();
    } catch { toast.error('Delete failed'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      await load();
    } catch { toast.error('Failed'); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100, padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', animation: 'zoomIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>📍 Addresses</h2>
            <p style={{ fontSize: 13, color: '#9e9e9e', marginTop: 2 }}>{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
        </div>

        {editAddr ? (
          /* ── Edit / New form ── */
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>Label</label>
                <select style={inputStyle} value={editAddr.label} onChange={e => setEditAddr({ ...editAddr, label: e.target.value })}>
                  {['Home', 'Work', 'Office', 'Hostel', "Mom's", 'Sister', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>Street Address</label>
                <input style={inputStyle} value={editAddr.street} onChange={e => setEditAddr({ ...editAddr, street: e.target.value })} placeholder="House no., Street, Area" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>City</label>
                <input style={inputStyle} value={editAddr.city} onChange={e => setEditAddr({ ...editAddr, city: e.target.value })} placeholder="City" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>State</label>
                <input style={inputStyle} value={editAddr.state} onChange={e => setEditAddr({ ...editAddr, state: e.target.value })} placeholder="State" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>PIN / ZIP</label>
                <input style={inputStyle} value={editAddr.zip} onChange={e => setEditAddr({ ...editAddr, zip: e.target.value })} placeholder="PIN code" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#636e72', display: 'block', marginBottom: 4 }}>Country</label>
                <input style={inputStyle} value={editAddr.country} onChange={e => setEditAddr({ ...editAddr, country: e.target.value })} placeholder="Country" required />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={editAddr.isDefault} onChange={e => setEditAddr({ ...editAddr, isDefault: e.target.checked })} style={{ width: 18, height: 18 }} />
                  Set as default address
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditAddr(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Address'}</button>
            </div>
          </form>
        ) : (
          /* ── Address list ── */
          <>
            <button className="btn btn-primary" style={{ marginBottom: 16, borderRadius: 20 }} onClick={() => setEditAddr({ ...EMPTY_ADDR })}>
              + Add New Address
            </button>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#636e72' }}>Loading…</div>
            ) : addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#9e9e9e' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                No addresses yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {addresses.map(addr => (
                  <div key={addr._id} style={{ border: `2px solid ${addr.isDefault ? '#6c63ff' : '#f0f0f0'}`, borderRadius: 14, padding: '14px 16px', position: 'relative', background: addr.isDefault ? '#f8f7ff' : 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ background: '#e8e6ff', color: '#6c63ff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{addr.label}</span>
                          {addr.isDefault && <span style={{ background: '#6c63ff', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ Default</span>}
                        </div>
                        <div style={{ fontSize: 14, color: '#2d3436', lineHeight: 1.5 }}>
                          {addr.street}<br />
                          {addr.city}, {addr.state} – {addr.zip}<br />
                          {addr.country}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        {!addr.isDefault && (
                          <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 12, fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
                            onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                        )}
                        <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#424242', borderRadius: 12, fontSize: 11, padding: '4px 10px' }}
                          onClick={() => setEditAddr({ ...addr })}>Edit</button>
                        <button className="btn btn-sm btn-danger" style={{ borderRadius: 12, fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleDelete(addr._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ManageUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [editUser, setEditUser]     = useState(null);
  const [modal, setModal]           = useState(false);
  const [addrUser, setAddrUser]     = useState(null);  // user whose addresses to manage
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_users') || '{}');
      return Object.fromEntries(USER_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(USER_COLS.map(c => [c, true])); }
  });
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir]     = useState('asc');
  // address counts keyed by userId (loaded lazily after users fetch)
  const [addrCounts, setAddrCounts] = useState({});

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('admin_cols_users', JSON.stringify(next));
    return next;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, search]);

  const sortedUsers = useMemo(() => {
    if (!sortField) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredUsers, sortField, sortDir]);

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
  const paginated  = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll({ limit: 10000 });
      setUsers(data.users);
      // load address counts in background for all users
      fetchAddrCounts(data.users);
    } catch { }
    setLoading(false);
  };

  const fetchAddrCounts = async (userList) => {
    const counts = {};
    await Promise.all(userList.map(async u => {
      try {
        const { data } = await addressAPI.getByUser(u._id);
        counts[u._id] = data.length;
      } catch { counts[u._id] = 0; }
    }));
    setAddrCounts(counts);
  };

  useEffect(() => { fetchUsers(); }, []);  // eslint-disable-line

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await userAPI.update(editUser._id, { name: editUser.name, email: editUser.email, role: editUser.role, isActive: editUser.isActive, phone: editUser.phone });
      toast.success('User updated!');
      setModal(false);
      fetchUsers();
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try { await userAPI.delete(id); toast.success('User deleted!'); fetchUsers(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleSelect    = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.filter(u => u.role !== 'admin').map(u => u._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    const deletable = [...selectedIds].filter(id => !users.find(u => u._id === id && u.role === 'admin'));
    if (deletable.length === 0) { toast.warning('Cannot delete admin users'); return; }
    if (!window.confirm(`Permanently delete ${deletable.length} user(s)?`)) return;
    try {
      await Promise.all(deletable.map(id => userAPI.delete(id)));
      toast.success(`${deletable.length} user(s) deleted`);
      setSelectedIds(new Set()); fetchUsers();
    } catch { toast.error('Some deletions failed'); }
  };
  const handleBulkSetActive = async (isActive) => {
    const targets = [...selectedIds].filter(id => !users.find(u => u._id === id && u.role === 'admin'));
    if (targets.length === 0) { toast.warning('No eligible users selected'); return; }
    try {
      await Promise.all(targets.map(id => userAPI.update(id, { isActive })));
      toast.success(`${targets.length} user(s) ${isActive ? 'activated' : 'deactivated'}`);
      setSelectedIds(new Set()); fetchUsers();
    } catch { toast.error('Some updates failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };
  const visibleCount = 4 + Object.values(visibleCols).filter(Boolean).length;

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>👥 <span className="gradient-text">Manage Users</span></h1>
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
          {search ? `${sortedUsers.length} / ${users.length}` : users.length} users
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
        <input className="form-input" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }}
          style={{ maxWidth: 320 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {USER_COLS.map(col => (
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
                  checked={paginated.filter(u => u.role !== 'admin').length > 0 && paginated.filter(u => u.role !== 'admin').every(u => selectedIds.has(u._id))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              <SortTh label="Name" field="name" {...sortProps} />
              {visibleCols['Email']     && <SortTh label="Email"     field="email"     {...sortProps} />}
              {visibleCols['Phone']     && <SortTh label="Phone"     field="phone"     {...sortProps} />}
              {visibleCols['Role']      && <SortTh label="Role"      field="role"      {...sortProps} />}
              {visibleCols['Status']    && <SortTh label="Status"    field="isActive"  {...sortProps} />}
              {visibleCols['Addresses'] && <th>Addresses</th>}
              {visibleCols['Joined']    && <SortTh label="Joined"    field="createdAt" {...sortProps} />}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleCount} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={visibleCount} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No users found.</td></tr>
            ) : paginated.map((user, i) => (
              <tr key={user._id}>
                <td>
                  {user.role !== 'admin' && (
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                      checked={selectedIds.has(user._id)} onChange={() => toggleSelect(user._id)} />
                  )}
                </td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                {visibleCols['Email']  && <td style={{ color: '#636e72' }}>{user.email}</td>}
                {visibleCols['Phone']  && <td style={{ color: '#636e72' }}>{user.phone || '—'}</td>}
                {visibleCols['Role']   && <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>}
                {visibleCols['Status'] && <td><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: user.isActive ? '#00b894' : '#d63031', marginRight: 6 }} />{user.isActive ? 'Active' : 'Inactive'}</td>}
                {visibleCols['Addresses'] && (
                  <td>
                    <button
                      style={{ background: '#f0fff4', color: '#00b894', border: '1.5px solid #b2dfdb', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onClick={() => setAddrUser(user)}>
                      📍 {addrCounts[user._id] != null ? addrCounts[user._id] : '…'}
                    </button>
                  </td>
                )}
                {visibleCols['Joined'] && <td style={{ color: '#636e72', fontSize: 13 }}>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>}
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => { setEditUser({ ...user }); setModal(true); }}>Edit</button>
                    <button className="btn btn-sm" style={{ background: '#f0fff4', color: '#00b894', borderRadius: 20 }} onClick={() => setAddrUser(user)}>📍 Addresses</button>
                    {user.role !== 'admin' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user._id, user.name)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {/* Edit user modal */}
      {modal && editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700 }}>✏️ Edit User</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 400 }}>(cannot be changed)</span></label>
                <input className="form-input" type="email" value={editUser.email} readOnly style={{ background: '#f5f5f5', color: '#9e9e9e', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={editUser.phone || ''} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={editUser.isActive} onChange={e => setEditUser({ ...editUser, isActive: e.target.checked })} style={{ width: 20, height: 20 }} />
                  Active Account
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address management modal */}
      {addrUser && (
        <AddressModal
          user={addrUser}
          onClose={() => { setAddrUser(null); fetchAddrCounts(users); }}
        />
      )}
    </AdminLayout>
  );
}
