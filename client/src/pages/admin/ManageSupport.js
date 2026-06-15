import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { supportAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const STATUS_COLORS = { open: '#00b894', closed: '#9e9e9e' };

export default function ManageSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [stats, setStats]     = useState({ unread: 0 });
  const bottomRef = useRef(null);

  useEffect(() => { loadAll(); }, [filter]);
  useEffect(() => {
    if (active) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [active]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ticketRes, statsRes] = await Promise.all([
        supportAPI.getAll(filter === 'all' ? null : filter),
        supportAPI.getStats(),
      ]);
      setTickets(ticketRes.data);
      setStats(statsRes.data);
    } catch {}
    setLoading(false);
  };

  const openTicket = async (t) => {
    setActive(t);
    if (t.adminUnread) {
      supportAPI.markSeen(t._id).catch(() => {});
      setTickets(prev => prev.map(tk => tk._id === t._id ? { ...tk, adminUnread: false } : tk));
      setStats(s => ({ ...s, unread: Math.max(0, s.unread - 1) }));
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !active) return;
    try {
      const { data } = await supportAPI.reply(active._id, replyText.trim());
      setActive(data);
      setTickets(prev => prev.map(t => t._id === data._id ? { ...t, updatedAt: data.updatedAt } : t));
      setReplyText('');
      toast.success('Reply sent');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch { toast.error('Failed to send reply'); }
  };

  const toggleStatus = async (t) => {
    const newStatus = t.status === 'open' ? 'closed' : 'open';
    try {
      const { data } = await supportAPI.updateStatus(t._id, newStatus);
      if (active?._id === t._id) setActive(data);
      setTickets(prev => prev.map(tk => tk._id === t._id ? { ...tk, status: newStatus } : tk));
      toast.success(`Ticket ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = tickets.filter(t =>
    !search || t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>🎧 Support Tickets {stats.unread > 0 && <span style={{ background: '#d63031', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 14, fontWeight: 700, marginLeft: 8 }}>{stats.unread} new</span>}</h1>
        <button className="btn btn-secondary" onClick={loadAll}>↻ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: 'calc(100vh - 140px)' }}>
        {/* Left panel — ticket list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <input className="form-input" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {['all', 'open', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: `2px solid ${filter === f ? '#6c63ff' : '#e0e0e0'}`, background: filter === f ? '#f0f0ff' : 'white', color: filter === f ? '#6c63ff' : '#9e9e9e', fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#636e72' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#9e9e9e' }}>No tickets found</div>
            ) : filtered.map(t => (
              <div key={t._id} onClick={() => openTicket(t)}
                style={{ background: active?._id === t._id ? '#f0f0ff' : 'white', borderRadius: 14, padding: '14px 16px', border: `2px solid ${active?._id === t._id ? '#6c63ff' : t.adminUnread ? '#fd79a8' : '#f0f0f0'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (active?._id !== t._id) e.currentTarget.style.borderColor = '#d0c8ff'; }}
                onMouseLeave={e => { if (active?._id !== t._id) e.currentTarget.style.borderColor = t.adminUnread ? '#fd79a8' : '#f0f0f0'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#212121', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  {t.adminUnread && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c2185b', flexShrink: 0, marginTop: 3 }} />}
                </div>
                <div style={{ fontSize: 12, color: '#636e72', marginBottom: 6 }}>{t.name} · {t.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#9e9e9e' }}>{t.messages?.length || 0} msg · {new Date(t.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}</span>
                  <span style={{ background: STATUS_COLORS[t.status] + '20', color: STATUS_COLORS[t.status], fontWeight: 700, padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — conversation */}
        {!active ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e', background: 'white', borderRadius: 20, border: '2px dashed #e0e0e0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>🎫</div>
              <div style={{ fontWeight: 600 }}>Select a ticket to view the conversation</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #e0e0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div style={{ background: '#f8f7ff', padding: '16px 22px', borderBottom: '1px solid #e0e0f0', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{active.subject}</div>
                <div style={{ fontSize: 12, color: '#636e72' }}>From: <strong>{active.name}</strong> ({active.email}) · {new Date(active.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
              </div>
              <button
                onClick={() => toggleStatus(active)}
                style={{ padding: '7px 16px', borderRadius: 20, border: `2px solid ${active.status === 'open' ? '#d63031' : '#00b894'}`, background: 'white', color: active.status === 'open' ? '#d63031' : '#00b894', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {active.status === 'open' ? '⚫ Close Ticket' : '🟢 Reopen Ticket'}
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {active.messages?.map((m, i) => {
                const isAdmin = m.sender === 'admin';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{ padding: '10px 16px', borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isAdmin ? 'linear-gradient(135deg,#6c63ff,#a29bfe)' : '#f5f5f5', color: isAdmin ? 'white' : '#212121', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize: 10, color: '#bdbdbd', marginTop: 4, textAlign: isAdmin ? 'right' : 'left', paddingLeft: isAdmin ? 0 : 4 }}>
                        {isAdmin ? '👩‍💼 Admin' : `👤 ${active.name}`} · {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply */}
            {active.status === 'open' ? (
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type reply… (Enter to send)"
                  rows={2}
                  style={{ flex: 1, resize: 'none', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
                />
                <button onClick={sendReply} disabled={!replyText.trim()} className="btn btn-primary" style={{ flexShrink: 0, padding: '10px 20px' }}>
                  Send Reply
                </button>
              </div>
            ) : (
              <div style={{ padding: '14px 20px', background: '#f5f5f5', textAlign: 'center', fontSize: 13, color: '#9e9e9e' }}>
                Ticket is closed. Reopen to continue the conversation.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
