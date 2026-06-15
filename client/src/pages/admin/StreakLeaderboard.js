import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { userAPI } from '../../utils/api';

const FILTERS = [
  { key: 'all',      label: 'All Users',   fn: () => true },
  { key: 'active',   label: '🔥 Active',   fn: u => (u.streak?.current || 0) > 0 },
  { key: '7plus',    label: '🎁 7+ days',  fn: u => (u.streak?.current || 0) >= 7 },
  { key: '30plus',   label: '👑 30+ days', fn: u => (u.streak?.current || 0) >= 30 },
  { key: 'inactive', label: '💤 No Streak',fn: u => (u.streak?.current || 0) === 0 },
];

const PAGE_SIZE = 15;

function Paginator({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination" style={{ marginTop: 16 }}>
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
}

function MilestoneBadge({ current }) {
  if (current >= 30) return <span style={{ background: 'linear-gradient(135deg,#fdcb6e,#e17055)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>👑 Champion</span>;
  if (current >= 7)  return <span style={{ background: 'linear-gradient(135deg,#c2185b,#e91e63)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>🎁 Milestone</span>;
  if (current > 0)   return <span style={{ background: '#fff0f5', color: '#c2185b', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: '1px solid #f8bbd0' }}>🔥 Active</span>;
  return <span style={{ background: '#f5f5f5', color: '#9e9e9e', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>💤 None</span>;
}

export default function StreakLeaderboard() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [sortField, setSortField] = useState('current');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    userAPI.getAll({ limit: 10000 })
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  };

  const processed = useMemo(() => {
    const filterFn = FILTERS.find(f => f.key === filter)?.fn || (() => true);
    const q = search.toLowerCase();
    let list = users.filter(filterFn).filter(u =>
      !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      let av, bv;
      if (sortField === 'current')   { av = a.streak?.current || 0; bv = b.streak?.current || 0; }
      if (sortField === 'longest')   { av = a.streak?.longest || 0; bv = b.streak?.longest || 0; }
      if (sortField === 'lastCheckIn') {
        av = a.streak?.lastCheckIn ? new Date(a.streak.lastCheckIn).getTime() : 0;
        bv = b.streak?.lastCheckIn ? new Date(b.streak.lastCheckIn).getTime() : 0;
      }
      if (sortField === 'name') { av = a.name || ''; bv = b.name || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [users, filter, search, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / PAGE_SIZE);
  const paginated  = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortTh = ({ label, field }) => {
    const active = sortField === field;
    return (
      <th onClick={() => handleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        {label}&nbsp;<span style={{ fontSize: 9, opacity: active ? 1 : 0.25 }}>{active && sortDir === 'desc' ? '▼' : '▲'}</span>
      </th>
    );
  };

  // summary stats
  const totalActive   = users.filter(u => (u.streak?.current || 0) > 0).length;
  const totalMilestone = users.filter(u => (u.streak?.current || 0) >= 7).length;
  const topStreak     = Math.max(0, ...users.map(u => u.streak?.current || 0));

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🔥 <span className="gradient-text">Streak Leaderboard</span></h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ background: '#fff0f5', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#c2185b' }}>
            🔥 {totalActive} active
          </div>
          <div style={{ background: '#fff8e1', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#f57f17' }}>
            🎁 {totalMilestone} milestone
          </div>
          <div style={{ background: '#f3e5f5', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#7b1fa2' }}>
            👑 Top: {topStreak} days
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            style={{ padding: '7px 18px', borderRadius: 20, border: `2px solid ${filter === f.key ? '#c2185b' : '#e0e0e0'}`, background: filter === f.key ? '#fff0f5' : 'white', color: filter === f.key ? '#c2185b' : '#636e72', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 340 }} />
      </div>

      <div className="table-container animate-fade">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#636e72' }}>Loading...</div>
        ) : processed.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9e9e9e' }}>No users match this filter.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <SortTh label="User" field="name" />
                  <th>Email</th>
                  <SortTh label="Current Streak" field="current" />
                  <SortTh label="Longest Streak" field="longest" />
                  <SortTh label="Last Check-in" field="lastCheckIn" />
                  <th>Status</th>
                  <th>Coupons Earned</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => {
                  const current   = u.streak?.current || 0;
                  const longest   = u.streak?.longest || 0;
                  const lastCI    = u.streak?.lastCheckIn;
                  const coupons   = u.streak?.earnedCoupons || [];
                  const rank      = (page - 1) * PAGE_SIZE + i + 1;

                  return (
                    <tr key={u._id}>
                      <td style={{ color: '#9e9e9e', fontWeight: 600 }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: current > 0 ? 'linear-gradient(135deg,#c2185b,#e91e63)' : 'linear-gradient(135deg,#bdbdbd,#9e9e9e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: '#9e9e9e' }}>{u.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#636e72', fontSize: 13 }}>{u.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 18 }}>{current > 0 ? '🔥' : '—'}</span>
                          <span style={{ fontWeight: 800, fontSize: 18, color: current >= 30 ? '#e17055' : current >= 7 ? '#c2185b' : current > 0 ? '#333' : '#bdbdbd' }}>
                            {current}
                          </span>
                          <span style={{ fontSize: 12, color: '#9e9e9e' }}>days</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#636e72' }}>{longest}</span>
                          <span style={{ fontSize: 12, color: '#9e9e9e' }}>days</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#636e72' }}>
                        {lastCI ? new Date(lastCI).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                      </td>
                      <td><MilestoneBadge current={current} /></td>
                      <td>
                        {coupons.length === 0 ? (
                          <span style={{ color: '#bdbdbd', fontSize: 12 }}>None</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {coupons.map((c, ci) => (
                              <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ background: '#fff0f5', border: '1px solid #f8bbd0', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#c2185b' }}>
                                  {c.code}
                                </span>
                                <span style={{ fontSize: 11, color: '#9e9e9e' }}>
                                  {c.discountValue}% · exp {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0 16px 16px' }}>
              <Paginator page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
