import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { reviewAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;
const REVIEW_COLS = ['Reviewer', 'Product', 'Rating', 'Comment', 'Status', 'Date'];
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

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

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_reviews') || '{}');
      return Object.fromEntries(REVIEW_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(REVIEW_COLS.map(c => [c, true])); }
  });

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('admin_cols_reviews', JSON.stringify(next));
    return next;
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await reviewAPI.getAll();
      setReviews(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleApprove = async (productId, reviewId, isApproved) => {
    try {
      await reviewAPI.update(productId, reviewId, isApproved);
      setReviews(prev => prev.map(r =>
        r._id === reviewId && r.productId === productId ? { ...r, isApproved } : r
      ));
      toast.success(isApproved ? 'Review approved' : 'Review rejected');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (productId, reviewId) => {
    if (!window.confirm('Permanently delete this review?')) return;
    try {
      await reviewAPI.delete(productId, reviewId);
      setReviews(prev => prev.filter(r => !(r._id === reviewId && r.productId === productId)));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = useMemo(() => {
    let list = reviews;
    if (statusFilter === 'approved') list = list.filter(r => r.isApproved !== false);
    else if (statusFilter === 'rejected') list = list.filter(r => r.isApproved === false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, statusFilter, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = getVal(a, sortField);
      const bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts = useMemo(() => ({
    all: reviews.length,
    approved: reviews.filter(r => r.isApproved !== false).length,
    rejected: reviews.filter(r => r.isApproved === false).length,
  }), [reviews]);

  const sortProps = { sortField, sortDir, onSort: handleSort };

  const reviewKey = r => `${r.productId}:${r._id}`;
  const toggleSelect = r => setSelectedKeys(prev => { const n = new Set(prev); const k = reviewKey(r); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleSelectAll = () => {
    const keys = paginated.map(reviewKey);
    const allOn = keys.length > 0 && keys.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => { const n = new Set(prev); keys.forEach(k => allOn ? n.delete(k) : n.add(k)); return n; });
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedKeys.size} review(s)? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedKeys].map(key => { const [pid, rid] = key.split(':'); return reviewAPI.delete(pid, rid); }));
      toast.success(`${selectedKeys.size} review(s) deleted`);
      setSelectedKeys(new Set());
      fetchReviews();
    } catch { toast.error('Some deletions failed'); }
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>⭐ <span className="gradient-text">Manage Reviews</span></h1>
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
          {filtered.length} / {reviews.length} reviews
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            style={{ padding: '6px 16px', borderRadius: 20, border: `2px solid ${statusFilter === tab.key ? '#6c63ff' : '#e0e0e0'}`, background: statusFilter === tab.key ? '#f0f0ff' : 'white', color: statusFilter === tab.key ? '#6c63ff' : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {tab.label}
            <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: statusFilter === tab.key ? '#6c63ff' : '#f0f0f0', color: statusFilter === tab.key ? 'white' : '#9e9e9e', fontSize: 11, fontWeight: 700 }}>
              {tabCounts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search by reviewer, product, or comment..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); setSelectedKeys(new Set()); }} style={{ maxWidth: 380 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {REVIEW_COLS.map(col => (
            <button key={col} onClick={() => toggleCol(col)}
              style={{ padding: '4px 12px', borderRadius: 20, border: `2px solid ${visibleCols[col] ? '#6c63ff' : '#e0e0e0'}`, background: visibleCols[col] ? '#f0f0ff' : 'white', color: visibleCols[col] ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {visibleCols[col] ? '✓ ' : ''}{col}
            </button>
          ))}
        </div>
      </div>

      {selectedKeys.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fff0f0', borderRadius: 12, marginBottom: 14, border: '2px solid #ffcccc', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828' }}>{selectedKeys.size} selected</span>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>🗑 Delete Selected</button>
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedKeys(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.length > 0 && paginated.every(r => selectedKeys.has(reviewKey(r)))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              {visibleCols.Reviewer && <SortTh label="Reviewer" field="name" {...sortProps} />}
              {visibleCols.Product && <SortTh label="Product" field="productName" {...sortProps} />}
              {visibleCols.Rating && <SortTh label="Rating" field="rating" {...sortProps} />}
              {visibleCols.Comment && <th>Comment</th>}
              {visibleCols.Status && <th>Status</th>}
              {visibleCols.Date && <SortTh label="Date" field="createdAt" {...sortProps} />}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No reviews found.</td></tr>
            ) : paginated.map((r, i) => {
              const approved = r.isApproved !== false;
              return (
                <tr key={`${r.productId}-${r._id}`} style={{ background: approved ? 'white' : '#fff8f8' }}>
                  <td><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                    checked={selectedKeys.has(reviewKey(r))} onChange={() => toggleSelect(r)} /></td>
                  <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  {visibleCols.Reviewer && <td style={{ fontWeight: 600 }}>{r.name}</td>}
                  {visibleCols.Product && (
                    <td>
                      <span style={{ background: '#f0f0ff', color: '#6c63ff', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {r.productName}
                      </span>
                    </td>
                  )}
                  {visibleCols.Rating && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#f9a825', fontSize: 14 }}>{'⭐'.repeat(r.rating)}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#424242' }}>{r.rating}/5</span>
                      </div>
                    </td>
                  )}
                  {visibleCols.Comment && (
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#636e72', fontSize: 13 }} title={r.comment}>
                      {r.comment}
                    </td>
                  )}
                  {visibleCols.Status && (
                    <td>
                      {approved
                        ? <span style={{ color: '#00b894', fontWeight: 700, fontSize: 12 }}>✓ Approved</span>
                        : <span style={{ color: '#d63031', fontWeight: 700, fontSize: 12 }}>✕ Rejected</span>}
                    </td>
                  )}
                  {visibleCols.Date && (
                    <td style={{ color: '#636e72', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {approved ? (
                        <button className="btn btn-sm" style={{ background: '#fff8f0', color: '#e17055', borderRadius: 20, whiteSpace: 'nowrap' }}
                          onClick={() => handleApprove(r.productId, r._id, false)}>
                          Reject
                        </button>
                      ) : (
                        <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#00b894', borderRadius: 20, whiteSpace: 'nowrap' }}
                          onClick={() => handleApprove(r.productId, r._id, true)}>
                          Approve
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.productId, r._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />
    </AdminLayout>
  );
}
