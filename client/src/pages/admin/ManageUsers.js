import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { userAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const USER_COLS = ['Email', 'Phone', 'Role', 'Status', 'Joined'];
const PAGE_SIZE = 10;

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

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_users') || '{}');
      return Object.fromEntries(USER_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(USER_COLS.map(c => [c, true])); }
  });
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

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
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
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
  const paginated = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll({ limit: 10000 });
      setUsers(data.users);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

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

  const toggleSelect = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.filter(u => u.role !== 'admin').map(u => u._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    const deletable = [...selectedIds].filter(id => !users.find(u => u._id === id && u.role === 'admin'));
    if (deletable.length === 0) { toast.warning('Cannot delete admin users'); return; }
    if (!window.confirm(`Permanently delete ${deletable.length} user(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(deletable.map(id => userAPI.delete(id)));
      toast.success(`${deletable.length} user(s) deleted`);
      setSelectedIds(new Set());
      fetchUsers();
    } catch { toast.error('Some deletions failed'); }
  };

  const handleBulkSetActive = async (isActive) => {
    const targets = [...selectedIds].filter(id => !users.find(u => u._id === id && u.role === 'admin'));
    if (targets.length === 0) { toast.warning('No eligible users selected'); return; }
    try {
      await Promise.all(targets.map(id => userAPI.update(id, { isActive })));
      toast.success(`${targets.length} user(s) ${isActive ? 'activated' : 'deactivated'}`);
      setSelectedIds(new Set());
      fetchUsers();
    } catch { toast.error('Some updates failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>👥 <span className="gradient-text">Manage Users</span></h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {search ? `${sortedUsers.length} / ${users.length}` : users.length} users
          </div>
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
        <input className="form-input" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }} style={{ maxWidth: 320 }} />
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
              {visibleCols['Email'] && <SortTh label="Email" field="email" {...sortProps} />}
              {visibleCols['Phone'] && <SortTh label="Phone" field="phone" {...sortProps} />}
              {visibleCols['Role'] && <SortTh label="Role" field="role" {...sortProps} />}
              {visibleCols['Status'] && <SortTh label="Status" field="isActive" {...sortProps} />}
              {visibleCols['Joined'] && <SortTh label="Joined" field="createdAt" {...sortProps} />}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={4 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No users found.</td></tr>
            ) : paginated.map((user, i) => (
              <tr key={user._id}>
                <td>{user.role !== 'admin' && <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={selectedIds.has(user._id)} onChange={() => toggleSelect(user._id)} />}</td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                {visibleCols['Email'] && <td style={{ color: '#636e72' }}>{user.email}</td>}
                {visibleCols['Phone'] && <td style={{ color: '#636e72' }}>{user.phone || '—'}</td>}
                {visibleCols['Role'] && <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>}
                {visibleCols['Status'] && <td><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: user.isActive ? '#00b894' : '#d63031', marginRight: 6 }} />{user.isActive ? 'Active' : 'Inactive'}</td>}
                {visibleCols['Joined'] && <td style={{ color: '#636e72', fontSize: 13 }}>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>}
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => { setEditUser({ ...user }); setModal(true); }}>Edit</button>
                    {user.role !== 'admin' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user._id, user.name)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

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
    </AdminLayout>
  );
}
