import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { visitAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const PERIODS = ['Daily', 'Monthly', 'Yearly'];
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

function BarChart({ data, labelKey, totalKey, uniqueKey, color }) {
  const max = Math.max(...data.map(d => d[totalKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 220, overflowX: 'auto', paddingBottom: 8 }}>
      {data.length === 0 && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e', fontSize: 14 }}>
          No data yet
        </div>
      )}
      {data.map((d, i) => {
        const pct = (d[totalKey] / max) * 180;
        const pctUniq = (d[uniqueKey] / max) * 180;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36, flex: '0 0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', marginBottom: 4 }}>{d[totalKey]}</div>
            <div style={{ position: 'relative', width: 28, height: 180, display: 'flex', alignItems: 'flex-end' }}>
              {/* unique visitors bar (behind) */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: pctUniq, background: `${color}33`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
              {/* total visits bar */}
              <div style={{ position: 'absolute', bottom: 0, left: '25%', width: '50%', height: pct, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
            </div>
            <div style={{ fontSize: 10, color: '#9e9e9e', marginTop: 4, maxWidth: 44, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d[labelKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatLabel(value, period) {
  if (period === 'Daily') {
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  if (period === 'Monthly') {
    const [y, m] = value.split('-');
    return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return String(value);
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('Daily');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [savingSnap, setSavingSnap] = useState(false);
  const [viewSnap, setViewSnap] = useState(null);

  const loadStats = useCallback(() => {
    setLoading(true);
    setError('');
    visitAPI.getStats()
      .then(({ data }) => { setStats(data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not connect to server. Make sure the backend is running and has been restarted after the last update.');
        setLoading(false);
      });
  }, []);

  const loadSnapshots = useCallback(() => {
    visitAPI.getSnapshots().then(r => setSnapshots(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadStats(); loadSnapshots(); }, [loadStats, loadSnapshots]);

  const handleSaveSnapshot = async () => {
    if (!stats) return;
    setSavingSnap(true);
    try {
      await visitAPI.saveSnapshot({
        label: snapshotLabel || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
        summary: stats.summary,
        daily: stats.daily,
        monthly: stats.monthly,
        yearly: stats.yearly,
      });
      toast.success('Snapshot saved!');
      setSnapshotLabel('');
      loadSnapshots();
    } catch { toast.error('Failed to save snapshot'); }
    setSavingSnap(false);
  };

  const handleDeleteSnapshot = async (id) => {
    try {
      await visitAPI.deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s._id !== id));
      if (viewSnap?._id === id) setViewSnap(null);
    } catch { toast.error('Failed to delete'); }
  };

  const chartData = () => {
    if (!stats) return [];
    if (period === 'Daily') return stats.daily.map(d => ({ label: formatLabel(d.date, 'Daily'), total: d.total, unique: d.unique }));
    if (period === 'Monthly') return stats.monthly.map(d => ({ label: formatLabel(d.month, 'Monthly'), total: d.total, unique: d.unique }));
    return stats.yearly.map(d => ({ label: String(d.year), total: d.total, unique: d.unique }));
  };

  const summaryCards = [
    { label: 'Total Visits', value: stats?.summary.total ?? 0, icon: '👁️', color: '#6c63ff', bg: '#f0f0ff' },
    { label: 'Today', value: stats?.summary.today ?? 0, icon: '📅', color: '#00b894', bg: '#e8fdf5' },
    { label: 'This Month', value: stats?.summary.thisMonth ?? 0, icon: '📆', color: '#fd79a8', bg: '#fff0f6' },
    { label: 'This Year', value: stats?.summary.thisYear ?? 0, icon: '🗓️', color: '#e17055', bg: '#fff4f0' },
  ];

  const filteredUsers = (stats?.userVisits || []).filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const userTotalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  const data = chartData();
  const tableRows = [...data].reverse().slice(0, 15);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              📈 <span className="gradient-text">Site Analytics</span>
            </h1>
            <p style={{ color: '#9e9e9e', fontSize: 14 }}>Track how many visitors come to Women HubClub</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 4 }}>⚠️ Analytics Error</div>
            <div style={{ fontSize: 13, color: '#b71c1c' }}>{error}</div>
          </div>
          <button className="btn btn-sm" style={{ background: '#c62828', color: 'white', borderRadius: 20, flexShrink: 0 }} onClick={loadStats}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9e9e9e' }}>Loading analytics...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {summaryCards.map(card => (
              <div key={card.label} style={{ background: card.bg, borderRadius: 20, padding: '20px 24px', border: `1px solid ${card.color}22` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: '#636e72', marginTop: 6, fontWeight: 600 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Chart panel */}
          <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>Visit Trend</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#636e72' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6c63ff', display: 'inline-block' }} /> Total visits
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#636e72' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6c63ff33', border: '1px solid #6c63ff', display: 'inline-block' }} /> Unique visitors
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PERIODS.map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    style={{ padding: '6px 18px', borderRadius: 20, border: `2px solid ${period === p ? '#6c63ff' : '#e0e0e0'}`, background: period === p ? '#6c63ff' : 'white', color: period === p ? 'white' : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <BarChart
              data={data}
              labelKey="label"
              totalKey="total"
              uniqueKey="unique"
              color="#6c63ff"
            />

            <div style={{ marginTop: 12, fontSize: 12, color: '#bdbdbd', textAlign: 'right' }}>
              {period === 'Daily' && 'Last 30 days'}
              {period === 'Monthly' && 'Last 12 months'}
              {period === 'Yearly' && 'All years'}
            </div>
          </div>

          {/* Data table */}
          <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              {period} Breakdown <span style={{ fontSize: 13, fontWeight: 400, color: '#9e9e9e' }}>(most recent first)</span>
            </h2>
            <div className="table-container" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{period === 'Daily' ? 'Date' : period === 'Monthly' ? 'Month' : 'Year'}</th>
                    <th>Total Visits</th>
                    <th>Unique Visitors</th>
                    <th>Returning</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No visit data recorded yet. Data will appear as users browse the site.</td></tr>
                  ) : tableRows.map((row, i) => {
                    const grandTotal = stats.summary.total || 1;
                    const pct = ((row.total / grandTotal) * 100).toFixed(1);
                    const returning = Math.max(0, row.total - row.unique);
                    return (
                      <tr key={i}>
                        <td style={{ color: '#9e9e9e' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.label}</td>
                        <td><span style={{ fontWeight: 700, color: '#6c63ff', fontSize: 16 }}>{row.total.toLocaleString()}</span></td>
                        <td><span style={{ fontWeight: 600, color: '#00b894' }}>{row.unique.toLocaleString()}</span></td>
                        <td style={{ color: '#636e72' }}>{returning.toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 6, background: '#f0f0ff', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: 'linear-gradient(90deg,#6c63ff,#fd79a8)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#9e9e9e' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* User visitors panel */}
          <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            {/* Header + mini stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>👤 Visitor Details</h2>
                <p style={{ fontSize: 13, color: '#9e9e9e', margin: 0 }}>Registered users who visited the site</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: '#f0f0ff', borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#6c63ff' }}>{stats?.summary.loggedIn ?? 0}</div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 600, marginTop: 2 }}>Logged-in visits</div>
                </div>
                <div style={{ background: '#f5f5f5', borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#636e72' }}>{stats?.summary.anonymous ?? 0}</div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 600, marginTop: 2 }}>Guest visits</div>
                </div>
                <div style={{ background: '#e8fdf5', borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#00b894' }}>{stats?.userVisits?.length ?? 0}</div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 600, marginTop: 2 }}>Unique users</div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                className="form-input"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                style={{ maxWidth: 340 }}
              />
            </div>

            {/* Table */}
            <div className="table-container" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total Visits</th>
                    <th>Pages Browsed</th>
                    <th>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>
                        {stats?.userVisits?.length === 0
                          ? 'No logged-in user visits recorded yet.'
                          : 'No users match your search.'}
                      </td>
                    </tr>
                  ) : paginatedUsers.map((u, i) => (
                    <tr key={u.userId || i}>
                      <td style={{ color: '#9e9e9e' }}>{(userPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: '#636e72' }}>{u.email || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#6c63ff', fontSize: 15 }}>{u.visits}</span>
                      </td>
                      <td>
                        <span style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                          {u.pageCount} page{u.pageCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ color: '#636e72', fontSize: 13 }}>
                        {u.lastVisit ? new Date(u.lastVisit).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={userPage} totalPages={userTotalPages} onPage={setUserPage} />
          </div>
        </>
      )}

      {/* ── Analytics Snapshots ── */}
      {!error && (
        <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>💾 Saved Snapshots</h2>
              <p style={{ color: '#9e9e9e', fontSize: 13, marginTop: 4 }}>Save a point-in-time copy of current analytics to compare later.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="Snapshot label (optional)"
                value={snapshotLabel} onChange={e => setSnapshotLabel(e.target.value)}
                style={{ maxWidth: 220, fontSize: 13 }} />
              <button className="btn btn-primary" onClick={handleSaveSnapshot} disabled={savingSnap || !stats}>
                {savingSnap ? '⏳ Saving...' : '📸 Save Now'}
              </button>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9e9e9e', fontSize: 14 }}>
              No snapshots yet. Click "Save Now" to capture current analytics.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshots.map(snap => (
                <div key={snap._id} style={{ border: `1.5px solid ${viewSnap?._id === snap._id ? '#6c63ff' : '#f0f0f0'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: viewSnap?._id === snap._id ? '#f8f7ff' : 'white', cursor: 'pointer' }}
                    onClick={() => setViewSnap(viewSnap?._id === snap._id ? null : snap)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{snap.label}</div>
                      <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 2 }}>
                        {new Date(snap.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        {snap.savedBy?.name && ` · by ${snap.savedBy.name}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#636e72' }}>
                      <span title="Total visits"><strong style={{ color: '#6c63ff' }}>{snap.summary?.total ?? 0}</strong> total</span>
                      <span title="This month"><strong style={{ color: '#00b894' }}>{snap.summary?.thisMonth ?? 0}</strong> month</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSnapshot(snap._id); }}
                      style={{ background: 'none', border: 'none', color: '#d63031', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>🗑</button>
                    <span style={{ fontSize: 16, color: '#9e9e9e', transition: 'transform 0.2s', transform: viewSnap?._id === snap._id ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </div>

                  {viewSnap?._id === snap._id && (
                    <div style={{ padding: '16px 18px', borderTop: '1px solid #f0f0f0', background: '#fafafe' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
                        {[
                          { label: 'Total', value: snap.summary?.total, color: '#6c63ff' },
                          { label: 'Today (at save)', value: snap.summary?.today, color: '#00b894' },
                          { label: 'This Month', value: snap.summary?.thisMonth, color: '#fd79a8' },
                          { label: 'Logged In', value: snap.summary?.loggedIn, color: '#e17055' },
                        ].map(c => (
                          <div key={c.label} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value ?? 0}</div>
                            <div style={{ fontSize: 11, color: '#9e9e9e' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: '#9e9e9e' }}>
                        Daily data points: {snap.daily?.length ?? 0} · Monthly: {snap.monthly?.length ?? 0} · Yearly: {snap.yearly?.length ?? 0}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
