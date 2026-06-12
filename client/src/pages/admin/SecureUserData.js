import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { userAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const ACCESS_PASSWORD = 'harsh@1234';
const PAGE_SIZE = 10;
const COLS = ['Email', 'Password Hash', 'Role', 'Joined', 'Copy'];

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

export default function SecureUserData() {
  const [unlocked, setUnlocked] = useState(false);
  const [attempt, setAttempt] = useState('');
  const [authError, setAuthError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCols, setVisibleCols] = useState(Object.fromEntries(COLS.map(c => [c, true])));
  const [showPass, setShowPass] = useState({});
  const [copied, setCopied] = useState('');

  const [resetModal, setResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (attempt === ACCESS_PASSWORD) { setUnlocked(true); setAuthError(''); }
    else { setAuthError('Wrong password. Access denied.'); setAttempt(''); }
  };

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    userAPI.secureDump()
      .then(({ data }) => setUsers(data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [unlocked]);

  const sorted = useMemo(() => {
    const filtered = search.trim()
      ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
      : users;
    return [...filtered].sort((a, b) => {
      let av = a[sortField] ?? '';
      let bv = b[sortField] ?? '';
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : new Date(av) - new Date(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, search, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const toggleCol = (col) => setVisibleCols(v => ({ ...v, [col]: !v[col] }));
  const togglePass = (id) => setShowPass(p => ({ ...p, [id]: !p[id] }));

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  const copyAll = () => {
    const text = sorted.map(u => `${u.email} | ${u.password}`).join('\n');
    copy(text, 'all');
  };

  const openReset = (u) => { setResetTarget(u); setNewPassword(''); setShowNewPass(false); setResetModal(true); };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) return toast.error('Password must be at least 4 characters');
    setSaving(true);
    try {
      await userAPI.resetPassword(resetTarget._id, newPassword);
      toast.success(`Password updated for ${resetTarget.name}`);
      setResetModal(false);
      // refresh to show new hash
      const { data } = await userAPI.secureDump();
      setUsers(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
    setSaving(false);
  };

  const SortBtn = ({ field, label }) => (
    <th onClick={() => toggleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}&nbsp;
      <span style={{ fontSize: 9, opacity: sortField === field ? 1 : 0.25 }}>
        {sortField === field && sortDir === 'desc' ? '▼' : '▲'}
      </span>
    </th>
  );

  if (!unlocked) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(108,99,255,0.12)', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Secure Access Required</h2>
            <p style={{ color: '#636e72', fontSize: 14, marginBottom: 28 }}>Enter the admin password to view sensitive user data.</p>
            <form onSubmit={handleUnlock}>
              <input type="password" className="form-input" placeholder="Enter access password"
                value={attempt} onChange={e => setAttempt(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: 3, fontSize: 18, marginBottom: 16 }} autoFocus />
              {authError && <div style={{ color: '#d63031', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>❌ {authError}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>🔓 Unlock</button>
            </form>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🔐 <span className="gradient-text">Secure User Data</span></h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {sorted.length} users
          </div>
          <button className="btn btn-sm btn-secondary" onClick={copyAll}>
            {copied === 'all' ? '✅ Copied!' : '📋 Copy All'}
          </button>
          <button className="btn btn-sm" style={{ background: '#fce4e4', color: '#d63031', border: 'none', borderRadius: 20 }}
            onClick={() => { setUnlocked(false); setAttempt(''); setUsers([]); }}>
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 280 }} />

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {COLS.map(col => (
            <button key={col} onClick={() => toggleCol(col)}
              style={{ padding: '3px 11px', borderRadius: 20, border: `2px solid ${visibleCols[col] ? '#6c63ff' : '#e0e0e0'}`, background: visibleCols[col] ? '#f0f0ff' : 'white', color: visibleCols[col] ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {visibleCols[col] ? '✓ ' : ''}{col}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>Sort:</span>
          {[{ label: 'Name', field: 'name' }, { label: 'Email', field: 'email' }, { label: 'Joined', field: 'createdAt' }].map(s => (
            <button key={s.field} onClick={() => toggleSort(s.field)}
              style={{ padding: '3px 11px', borderRadius: 20, border: `2px solid ${sortField === s.field ? '#6c63ff' : '#e0e0e0'}`, background: sortField === s.field ? '#f0f0ff' : 'white', color: sortField === s.field ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {s.label} {sortField === s.field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <SortBtn field="name" label="Name" />
              {visibleCols['Email'] && <SortBtn field="email" label="Email" />}
              {visibleCols['Password Hash'] && <th>Password Hash</th>}
              {visibleCols['Role'] && <SortBtn field="role" label="Role" />}
              {visibleCols['Joined'] && <SortBtn field="createdAt" label="Joined" />}
              <th>Reset Password</th>
              {visibleCols['Copy'] && <th>Copy</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No users found.</td></tr>
            ) : paginated.map((u, i) => (
              <tr key={u._id}>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                  </div>
                </td>
                {visibleCols['Email'] && (
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.email}</td>
                )}
                {visibleCols['Password Hash'] && (
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 220 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#636e72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {showPass[u._id] ? u.password : '••••••••••••••••'}
                      </span>
                      <button onClick={() => togglePass(u._id)}
                        style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                        {showPass[u._id] ? '🙈' : '👁'}
                      </button>
                    </div>
                  </td>
                )}
                {visibleCols['Role'] && (
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                )}
                {visibleCols['Joined'] && (
                  <td style={{ fontSize: 13, color: '#636e72' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                )}
                <td>
                  <button className="btn btn-sm" style={{ background: '#fff0f0', color: '#d63031', borderRadius: 20, whiteSpace: 'nowrap' }}
                    onClick={() => openReset(u)}>
                    🔑 Reset
                  </button>
                </td>
                {visibleCols['Copy'] && (
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => copy(u.email, `email-${u._id}`)} title="Copy email"
                        style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, color: copied === `email-${u._id}` ? '#00b894' : '#636e72', fontWeight: 600 }}>
                        {copied === `email-${u._id}` ? '✅' : '📧'}
                      </button>
                      <button onClick={() => copy(u.password, `pass-${u._id}`)} title="Copy hash"
                        style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, color: copied === `pass-${u._id}` ? '#00b894' : '#636e72', fontWeight: 600 }}>
                        {copied === `pass-${u._id}` ? '✅' : '🔑'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#9e9e9e' }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <Paginator page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {/* Reset Password Modal */}
      {resetModal && resetTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>🔑 Reset Password</h2>
              <button onClick={() => setResetModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#f8f7ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{resetTarget.name}</div>
              <div style={{ fontSize: 13, color: '#636e72', fontFamily: 'monospace' }}>{resetTarget.email}</div>
            </div>

            <form onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Enter new password (min 4 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowNewPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                    {showNewPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}
                  style={{ background: 'linear-gradient(135deg,#d63031,#e17055)' }}>
                  {saving ? 'Saving...' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
