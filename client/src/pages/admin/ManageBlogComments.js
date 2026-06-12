import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { blogCommentAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const statusStyle = (s) => {
  if (s === 'approved') return { background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 };
  if (s === 'rejected') return { background: '#fce4ec', color: '#c62828', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 };
  return { background: '#fff8e1', color: '#f57f17', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 };
};

export default function ManageBlogComments() {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab !== 'all') params.status = tab;
      const [cRes, sRes] = await Promise.all([
        blogCommentAPI.getAll(params),
        blogCommentAPI.getStats(),
      ]);
      setComments(cRes.data);
      setStats(sRes.data);
    } catch {
      toast.error('Failed to load comments');
    }
    setLoading(false);
    setSelected(new Set());
  }, [tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatus = async (id, status) => {
    try {
      await blogCommentAPI.updateStatus(id, status);
      toast.success(`Comment ${status}`);
      fetchAll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await blogCommentAPI.delete(id);
      toast.success('Comment deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c._id)));
  };

  const bulkApprove = async () => {
    if (!selected.size) return;
    try {
      await blogCommentAPI.bulkUpdate([...selected], 'approved');
      toast.success(`${selected.size} comments approved`);
      fetchAll();
    } catch { toast.error('Bulk approve failed'); }
  };

  const bulkReject = async () => {
    if (!selected.size) return;
    try {
      await blogCommentAPI.bulkUpdate([...selected], 'rejected');
      toast.success(`${selected.size} comments rejected`);
      fetchAll();
    } catch { toast.error('Bulk reject failed'); }
  };

  const bulkDelete = async () => {
    if (!selected.size || !window.confirm(`Delete ${selected.size} comments?`)) return;
    try {
      await blogCommentAPI.bulkDelete([...selected]);
      toast.success(`${selected.size} comments deleted`);
      fetchAll();
    } catch { toast.error('Bulk delete failed'); }
  };

  const filtered = comments.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.body.toLowerCase().includes(search.toLowerCase()) ||
    c.postSlug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ padding: '32px 0' }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Blog Comment Management</h2>
        <p style={{ color: '#9e9e9e', marginBottom: 28 }}>Review, approve, and manage all blog comments</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total', value: stats.total, color: '#6c63ff' },
            { label: 'Pending', value: stats.pending, color: '#f57f17' },
            { label: 'Approved', value: stats.approved, color: '#2e7d32' },
            { label: 'Rejected', value: stats.rejected, color: '#c62828' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#9e9e9e', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, background: '#f5f5f5', borderRadius: 12, padding: 4 }}>
              {STATUS_TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: tab === t ? '#6c63ff' : 'transparent', color: tab === t ? 'white' : '#757575', transition: 'all 0.2s' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input placeholder="Search comments..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
            {selected.size > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={bulkApprove} className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 8 }}>
                  Approve ({selected.size})
                </button>
                <button onClick={bulkReject} className="btn btn-sm" style={{ background: '#fff8e1', color: '#f57f17', border: 'none', borderRadius: 8 }}>
                  Reject ({selected.size})
                </button>
                <button onClick={bulkDelete} className="btn btn-sm" style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8 }}>
                  Delete ({selected.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9e9e9e' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9e9e9e' }}>No comments found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', width: 40 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>AUTHOR</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>COMMENT</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>POST</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>STATUS</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>DATE</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9e9e9e' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelect(c._id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      {c.email && <div style={{ fontSize: 11, color: '#9e9e9e' }}>{c.email}</div>}
                    </td>
                    <td style={{ padding: '12px 12px', maxWidth: 300 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#424242', lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {c.body}
                      </p>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600 }}>/{c.postSlug}</span>
                      {c.postTitle && <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>{c.postTitle}</div>}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={statusStyle(c.status)}>{c.status}</span>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 12, color: '#9e9e9e', whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.status !== 'approved' && (
                          <button onClick={() => handleStatus(c._id, 'approved')}
                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#e8f5e9', color: '#2e7d32' }}>
                            Approve
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button onClick={() => handleStatus(c._id, 'rejected')}
                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#fff8e1', color: '#f57f17' }}>
                            Reject
                          </button>
                        )}
                        <button onClick={() => handleDelete(c._id)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#fce4ec', color: '#c62828' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
