import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { userAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const USER_COLS = ['Email', 'Phone', 'Role', 'Status', 'Joined'];

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

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => Object.fromEntries(USER_COLS.map(c => [c, true])));
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const toggleCol = (col) => setVisibleCols(v => ({ ...v, [col]: !v[col] }));

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedUsers = useMemo(() => {
    if (!sortField) return users;
    return [...users].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, sortField, sortDir]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll({ page, limit: 10, search });
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

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

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>👥 <span className="gradient-text">Manage Users</span></h1>
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>Total: {total}</div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320 }} />
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
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : sortedUsers.map((user, i) => (
              <tr key={user._id}>
                <td style={{ color: '#636e72' }}>{(page - 1) * 10 + i + 1}</td>
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

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

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
