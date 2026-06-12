import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { contactAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;
const CONTACT_COLS = ['Email', 'Subject', 'Message', 'Status', 'Date'];

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

export default function ManageContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [viewMsg, setViewMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_cols_contacts') || '{}');
      return Object.fromEntries(CONTACT_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(CONTACT_COLS.map(c => [c, true])); }
  });

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('admin_cols_contacts', JSON.stringify(next));
    return next;
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data } = await contactAPI.getAll({ limit: 10000 });
      setContacts(data.contacts);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleMarkRead = async (id, isRead) => {
    try {
      await contactAPI.markRead(id, isRead);
      setContacts(prev => prev.map(c => c._id === id ? { ...c, isRead } : c));
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await contactAPI.delete(id);
      toast.success('Message deleted');
      setContacts(prev => prev.filter(c => c._id !== id));
      if (viewMsg?._id === id) setViewMsg(null);
    } catch { toast.error('Failed to delete'); }
  };

  const openMsg = async (contact) => {
    setViewMsg(contact);
    setReplyText('');
    if (!contact.isRead) handleMarkRead(contact._id, true);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !viewMsg) return;
    setReplying(true);
    try {
      const { data } = await contactAPI.reply(viewMsg._id, replyText.trim());
      toast.success('Reply sent!');
      setViewMsg(data);
      setReplyText('');
      setContacts(prev => prev.map(c => c._id === data._id ? data : c));
    } catch { toast.error('Failed to send reply'); }
    setReplying(false);
  };

  const filtered = useMemo(() => {
    let list = contacts;
    if (readFilter === 'unread') list = list.filter(c => !c.isRead);
    else if (readFilter === 'read') list = list.filter(c => c.isRead);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, readFilter, search]);

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
  const unreadCount = contacts.filter(c => !c.isRead).length;
  const toggleSelect = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.map(c => c._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} message(s)? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map(id => contactAPI.delete(id)));
      toast.success(`${selectedIds.size} message(s) deleted`);
      setSelectedIds(new Set());
      setContacts(prev => prev.filter(c => !selectedIds.has(c._id)));
    } catch { toast.error('Some deletions failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>
          💬 <span className="gradient-text">Contact Messages</span>
          {unreadCount > 0 && (
            <span style={{ marginLeft: 12, padding: '2px 10px', background: '#d63031', color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {unreadCount} new
            </span>
          )}
        </h1>
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
          {filtered.length} / {contacts.length} messages
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search by name, email, subject..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([key, label]) => (
            <button key={key} onClick={() => { setReadFilter(key); setPage(1); }}
              style={{ padding: '6px 16px', borderRadius: 20, border: `2px solid ${readFilter === key ? '#6c63ff' : '#e0e0e0'}`, background: readFilter === key ? '#f0f0ff' : 'white', color: readFilter === key ? '#6c63ff' : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {label}
              {key === 'unread' && unreadCount > 0 && <span style={{ marginLeft: 5, background: '#d63031', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{unreadCount}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
          {CONTACT_COLS.map(col => (
            <button key={col} onClick={() => toggleCol(col)}
              style={{ padding: '4px 12px', borderRadius: 20, border: `2px solid ${visibleCols[col] ? '#6c63ff' : '#e0e0e0'}`, background: visibleCols[col] ? '#f0f0ff' : 'white', color: visibleCols[col] ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {visibleCols[col] ? '✓ ' : ''}{col}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fff0f0', borderRadius: 12, marginBottom: 14, border: '2px solid #ffcccc', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828' }}>{selectedIds.size} selected</span>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>🗑 Delete Selected</button>
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedIds(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.length > 0 && paginated.every(c => selectedIds.has(c._id))}
                  onChange={toggleSelectAll} />
              </th>
              <th>#</th>
              <SortTh label="Name" field="name" {...sortProps} />
              {visibleCols['Email'] && <SortTh label="Email" field="email" {...sortProps} />}
              {visibleCols['Subject'] && <SortTh label="Subject" field="subject" {...sortProps} />}
              {visibleCols['Message'] && <th>Message</th>}
              {visibleCols['Status'] && <th>Status</th>}
              {visibleCols['Date'] && <SortTh label="Date" field="createdAt" {...sortProps} />}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={4 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No messages found.</td></tr>
            ) : paginated.map((c, i) => (
              <tr key={c._id} style={{ fontWeight: c.isRead ? 400 : 700, background: c.isRead ? 'white' : '#fdf8ff' }}>
                <td><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!c.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', flexShrink: 0, display: 'inline-block' }} />}
                    {c.name}
                  </div>
                </td>
                {visibleCols['Email'] && <td style={{ color: '#636e72', fontSize: 13 }}>{c.email}</td>}
                {visibleCols['Subject'] && <td><span style={{ background: '#f0f0ff', color: '#6c63ff', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{c.subject}</span></td>}
                {visibleCols['Message'] && <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#636e72', fontSize: 13 }}>{c.message}</td>}
                {visibleCols['Status'] && <td>
                  {c.isRead
                    ? <span style={{ color: '#9e9e9e', fontSize: 12 }}>Read</span>
                    : <span style={{ color: '#6c63ff', fontWeight: 700, fontSize: 12 }}>Unread</span>}
                </td>}
                {visibleCols['Date'] && <td style={{ color: '#636e72', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </td>}
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openMsg(c)}>View</button>
                    <button className="btn btn-sm" style={{ background: c.isRead ? '#fff8f0' : '#f0fdf4', color: c.isRead ? '#e17055' : '#00b894', borderRadius: 20, whiteSpace: 'nowrap' }}
                      onClick={() => handleMarkRead(c._id, !c.isRead)}>
                      {c.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {/* Message detail modal */}
      {viewMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 560, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20 }}>💬 Message</h2>
              <button onClick={() => { setViewMsg(null); setReplyText(''); }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>From</div>
                  <div style={{ fontWeight: 700 }}>{viewMsg.name}</div>
                  <div style={{ fontSize: 13, color: '#636e72' }}>{viewMsg.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Received</div>
                  <div style={{ fontSize: 13, color: '#636e72' }}>{new Date(viewMsg.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Subject</div>
                <span style={{ background: '#f0f0ff', color: '#6c63ff', padding: '4px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{viewMsg.subject}</span>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Message</div>
                <div style={{ background: '#fafafa', borderRadius: 12, padding: '16px 20px', fontSize: 14, lineHeight: 1.8, color: '#2d3436', border: '1px solid #f0f0f0', whiteSpace: 'pre-wrap' }}>
                  {viewMsg.message}
                </div>
              </div>

              {viewMsg.replies?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Admin Replies</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {viewMsg.replies.map((r, i) => (
                      <div key={i} style={{ background: '#f0f0ff', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#2d3436', borderLeft: '3px solid #6c63ff' }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{r.message}</div>
                        <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 4 }}>
                          {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Reply</div>
                <textarea
                  className="form-input"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'Poppins' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  style={{ marginTop: 8 }}>
                  {replying ? 'Sending...' : '📨 Send Reply'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => { setViewMsg(null); setReplyText(''); }}>Close</button>
              <button className="btn btn-sm" style={{ background: viewMsg.isRead ? '#fff8f0' : '#f0fdf4', color: viewMsg.isRead ? '#e17055' : '#00b894' }}
                onClick={() => { handleMarkRead(viewMsg._id, !viewMsg.isRead); setViewMsg({ ...viewMsg, isRead: !viewMsg.isRead }); }}>
                {viewMsg.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(viewMsg._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
