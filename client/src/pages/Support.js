import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supportAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './Support.css';

/* ── constants ── */
const CATEGORIES = [
  { value: 'Order Issue',  icon: '📦', desc: 'Missing, wrong or damaged order' },
  { value: 'Payment',      icon: '💳', desc: 'Billing, refund or payment failed' },
  { value: 'Shipping',     icon: '🚚', desc: 'Delivery delay or tracking issue' },
  { value: 'Product',      icon: '🌸', desc: 'Product quality or information' },
  { value: 'Technical',    icon: '⚙️',  desc: 'App bug or login problem' },
  { value: 'Account',      icon: '👤', desc: 'Profile, password or settings' },
  { value: 'Other',        icon: '💬', desc: 'Anything else' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#00b894', bg: '#e8fff5' },
  { value: 'medium', label: 'Medium', color: '#f39c12', bg: '#fffbf0' },
  { value: 'high',   label: 'High',   color: '#e17055', bg: '#fff5f0' },
  { value: 'urgent', label: 'Urgent', color: '#d63031', bg: '#fff0f0' },
];

const STATUS_META = {
  'open':        { label: 'Open',        color: '#6c63ff', bg: '#f0f0ff', dot: '🟣' },
  'in-progress': { label: 'In Progress', color: '#f39c12', bg: '#fffbf0', dot: '🟡' },
  'resolved':    { label: 'Resolved',    color: '#00b894', bg: '#e8fff5', dot: '🟢' },
  'closed':      { label: 'Closed',      color: '#9e9e9e', bg: '#f5f5f5', dot: '⚫' },
};

const STATUS_TABS = ['all', 'open', 'in-progress', 'resolved', 'closed'];

function priorityMeta(v) { return PRIORITIES.find(p => p.value === v) || PRIORITIES[1]; }
function statusMeta(v)   { return STATUS_META[v] || STATUS_META['open']; }

function PriorityBadge({ value }) {
  const m = priorityMeta(value);
  return (
    <span className={`supp-priority-badge supp-priority-${value}`}>
      {value === 'urgent' ? '🔴' : value === 'high' ? '🟠' : value === 'medium' ? '🟡' : '🟢'} {m.label}
    </span>
  );
}

function StatusBadge({ value }) {
  const m = statusMeta(value);
  return (
    <span className={`supp-status-badge supp-status-${value}`}>
      {m.dot} {m.label}
    </span>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatFull(date) {
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Sub-views ── */

function TicketList({ tickets, loading, onOpen, onNew, statusTab, setStatusTab, search, setSearch }) {
  const filtered = tickets.filter(t => {
    if (statusTab !== 'all' && t.status !== statusTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.subject?.toLowerCase().includes(q) || t.ticketId?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = tickets.filter(t => t.userUnread).length;

  return (
    <div>
      {/* Quick stats */}
      <div className="supp-stats-grid">
        {[
          { label: 'Total Tickets',  value: tickets.length,                              icon: '🎫' },
          { label: 'Open',           value: tickets.filter(t=>t.status==='open').length, icon: '🟣' },
          { label: 'In Progress',    value: tickets.filter(t=>t.status==='in-progress').length, icon: '🟡' },
          { label: 'Resolved',       value: tickets.filter(t=>t.status==='resolved'||t.status==='closed').length, icon: '✅' },
        ].map(s => (
          <div key={s.label} className="supp-stat-card">
            <div className="supp-stat-icon">{s.icon}</div>
            <div className="supp-stat-value">{s.value}</div>
            <div className="supp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + New */}
      <div className="supp-toolbar-row">
        <div className="supp-search-wrap">
          <span className="supp-search-icon">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, ID or category…"
            className="supp-search-input"
          />
        </div>
        <button className="btn btn-primary supp-new-btn" onClick={onNew}>
          + New Ticket
        </button>
      </div>

      {/* Status tabs */}
      <div className="supp-status-tabs">
        {STATUS_TABS.map(tab => {
          const count = tab === 'all' ? tickets.length : tickets.filter(t => t.status === tab).length;
          const active = statusTab === tab;
          return (
            <button key={tab} onClick={() => setStatusTab(tab)}
              className={`supp-status-tab${active ? ' active' : ''}`}>
              {tab === 'all' ? 'All' : STATUS_META[tab]?.label || tab} ({count})
            </button>
          );
        })}
        {unreadCount > 0 && (
          <span className="supp-unread-pill">
            🔔 {unreadCount} new repl{unreadCount === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="supp-skeleton-list">
          {[1,2,3].map(i => (
            <div key={i} className="supp-skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="supp-empty">
          <div className="supp-empty-icon">🎧</div>
          <h3 className="supp-empty-title">
            {search ? 'No tickets match your search' : 'No tickets yet'}
          </h3>
          <p className="supp-empty-sub">
            {search ? 'Try a different keyword' : 'Create your first support ticket and we\'ll help you out.'}
          </p>
          {!search && <button className="btn btn-primary" onClick={onNew}>Create Ticket</button>}
        </div>
      ) : (
        <div className="supp-ticket-list">
          {filtered.map(t => (
            <div key={t._id} onClick={() => onOpen(t)}
              className={`supp-ticket-row${t.userUnread ? ' unread' : ''}`}>

              {/* New-reply stripe */}
              {t.userUnread && <div className="supp-ticket-stripe" />}

              {/* Category icon */}
              <div className="supp-ticket-icon">
                {CATEGORIES.find(c => c.value === t.category)?.icon || '💬'}
              </div>

              <div className="supp-ticket-info">
                <div className="supp-ticket-top-row">
                  <span className="supp-ticket-id">
                    {t.ticketId || '#—'}
                  </span>
                  <span className="supp-ticket-subject">{t.subject}</span>
                  {t.userUnread && <span className="supp-ticket-newreply">NEW REPLY</span>}
                </div>
                <div className="supp-ticket-meta-row">
                  <PriorityBadge value={t.priority || 'medium'} />
                  <span className="supp-ticket-category">
                    {t.category || 'Other'}
                  </span>
                  <span className="supp-ticket-meta-text">
                    {t.messages?.length || 0} msg{t.messages?.length !== 1 ? 's' : ''} · {timeAgo(t.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="supp-ticket-right">
                <StatusBadge value={t.status} />
                <span className="supp-ticket-chevron">›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTicketForm({ user, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    subject: '', message: '', category: '', priority: 'medium',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.category) return toast.warning('Please choose a category');
    if (!form.subject.trim() || !form.message.trim()) return toast.error('Subject and message are required');
    onSubmit(form);
  };

  return (
    <div style={{ background: 'white', borderRadius: 24, padding: '32px 28px', boxShadow: '0 8px 32px rgba(108,99,255,0.1)', border: '1px solid #e0e0ff', maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>📝 New Support Ticket</h2>
      <p style={{ color: '#9e9e9e', fontSize: 14, marginBottom: 28 }}>Fill in the details below — our team typically responds within 24 hours.</p>

      <form onSubmit={handleSubmit}>
        {/* Category picker */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            What can we help you with? *
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
            {CATEGORIES.map(c => (
              <div key={c.value} onClick={() => set('category', c.value)}
                style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${form.category === c.value ? '#6c63ff' : '#e8e8e8'}`, background: form.category === c.value ? '#f0f0ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: form.category === c.value ? '#6c63ff' : '#333' }}>{c.value}</div>
                <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 3, lineHeight: 1.3 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRIORITIES.map(p => (
              <div key={p.value} onClick={() => set('priority', p.value)}
                style={{ padding: '8px 18px', borderRadius: 20, border: `2px solid ${form.priority === p.value ? p.color : '#e0e0e0'}`, background: form.priority === p.value ? p.bg : 'white', color: form.priority === p.value ? p.color : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                {p.value === 'urgent' ? '🔴' : p.value === 'high' ? '🟠' : p.value === 'medium' ? '🟡' : '🟢'} {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Name + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Your Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required readOnly={!!user} style={user ? { background: '#f8f7ff' } : {}} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required readOnly={!!user} style={user ? { background: '#f8f7ff' } : {}} />
          </div>
        </div>

        {/* Subject */}
        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input className="form-input" placeholder="Brief description of your issue" value={form.subject} onChange={e => set('subject', e.target.value)} required />
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea className="form-input" rows={5} placeholder="Describe your issue in detail — include order numbers, screenshots links, or anything that helps us understand." value={form.message} onChange={e => set('message', e.target.value)} required style={{ resize: 'vertical', minHeight: 110 }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
            {submitting ? '⏳ Submitting…' : '🎫 Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TicketConversation({ ticket, onBack, onRefresh }) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [closing, setClosing]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [ticket?.messages?.length]);

  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await supportAPI.sendMessage(ticket._id, replyText.trim());
      setReplyText('');
      await onRefresh(ticket._id);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch { toast.error('Failed to send message'); }
    setSending(false);
  };

  const closeTicket = async () => {
    if (!window.confirm('Close this ticket? You can open a new one anytime.')) return;
    setClosing(true);
    try {
      await supportAPI.closeTicket(ticket._id);
      toast.success('Ticket closed');
      await onRefresh(ticket._id);
    } catch { toast.error('Failed to close ticket'); }
    setClosing(false);
  };

  const sm = statusMeta(ticket.status);
  const canReply = ticket.status !== 'closed';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Ticket header card */}
      <div style={{ background: 'white', borderRadius: 20, padding: '20px 24px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32 }}>{CATEGORIES.find(c => c.value === ticket.category)?.icon || '💬'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: '#6c63ff', background: '#f0f0ff', padding: '3px 10px', borderRadius: 8 }}>
                {ticket.ticketId || '—'}
              </span>
              <StatusBadge value={ticket.status} />
              <PriorityBadge value={ticket.priority || 'medium'} />
              <span style={{ fontSize: 11, color: '#bdbdbd', background: '#fafafa', border: '1px solid #eee', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                {ticket.category}
              </span>
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 18, color: '#212121', margin: 0, lineHeight: 1.3 }}>{ticket.subject}</h2>
            <div style={{ fontSize: 12, color: '#bdbdbd', marginTop: 4 }}>
              Opened {formatFull(ticket.createdAt)} · {ticket.messages?.length || 0} message{ticket.messages?.length !== 1 ? 's' : ''}
            </div>
          </div>
          {canReply && (
            <button onClick={closeTicket} disabled={closing}
              style={{ padding: '8px 18px', borderRadius: 10, border: '2px solid #e0e0e0', background: 'white', color: '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {closing ? '…' : '✕ Close Ticket'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
        {/* Message thread */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 480, overflowY: 'auto' }}>
          {ticket.messages?.map((m, i) => {
            const isUser = m.sender === 'user';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
                {/* Admin avatar */}
                {!isUser && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a29bfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    🎧
                  </div>
                )}

                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: 11, color: '#bdbdbd', marginBottom: 4, textAlign: isUser ? 'right' : 'left', fontWeight: 600 }}>
                    {isUser ? 'You' : m.senderName || 'Support Team'} · {formatFull(m.createdAt)}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isUser ? 'linear-gradient(135deg,#6c63ff,#a29bfe)' : '#f5f5f7',
                    color: isUser ? 'white' : '#212121',
                    fontSize: 14,
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: isUser ? '0 4px 14px rgba(108,99,255,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    {m.text}
                  </div>
                </div>

                {/* User avatar */}
                {isUser && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#e91e63)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                    {ticket.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {ticket.status === 'closed' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ background: '#f5f5f5', color: '#9e9e9e', fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 20 }}>
                ⚫ This ticket is closed
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {canReply ? (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 20px', background: '#fafafa' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#e91e63)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 15, flexShrink: 0, marginBottom: 2 }}>
                {ticket.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: 16, border: '2px solid #e8e8e8', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = '#6c63ff'}
                onBlurCapture={e => e.currentTarget.style.borderColor = '#e8e8e8'}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{ width: '100%', border: 'none', padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', background: 'transparent', boxSizing: 'border-box', lineHeight: 1.5 }}
                />
              </div>
              <button onClick={sendReply} disabled={!replyText.trim() || sending}
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: replyText.trim() ? 'linear-gradient(135deg,#6c63ff,#a29bfe)' : '#e0e0e0', color: 'white', fontSize: 18, cursor: replyText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: replyText.trim() ? '0 4px 12px rgba(108,99,255,0.4)' : 'none', transition: 'all 0.2s' }}>
                {sending ? '⏳' : '➤'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#bdbdbd', marginTop: 8, paddingLeft: 46 }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', background: '#f5f5f5', textAlign: 'center', fontSize: 13, color: '#9e9e9e', borderTop: '1px solid #eee' }}>
            This ticket is closed. <button style={{ background: 'none', border: 'none', color: '#6c63ff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }} onClick={onBack}>Open a new ticket →</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function Support() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [view, setView]         = useState('list');   // 'list' | 'new' | 'ticket'
  const [tickets, setTickets]   = useState([]);
  const [active, setActive]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusTab, setStatusTab]   = useState('all');
  const [search, setSearch]         = useState('');

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supportAPI.getMine();
      setTickets(data);
    } catch {}
    setLoading(false);
  };

  const openTicket = async (t) => {
    try {
      const { data } = await supportAPI.getTicket(t._id);
      setActive(data);
      setTickets(prev => prev.map(tk => tk._id === data._id ? { ...tk, userUnread: false } : tk));
      setView('ticket');
    } catch { toast.error('Failed to load ticket'); }
  };

  const refreshActive = async (id) => {
    try {
      const { data } = await supportAPI.getTicket(id);
      setActive(data);
      setTickets(prev => prev.map(t => t._id === data._id ? data : t));
    } catch {}
  };

  const submitNew = async (form) => {
    setSubmitting(true);
    try {
      const { data } = await supportAPI.create(form);
      setTickets(prev => [data, ...prev]);
      setActive(data);
      setView('ticket');
      toast.success('🎫 Ticket submitted! We\'ll respond within 24 hours.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create ticket'); }
    setSubmitting(false);
  };

  const goBack = () => {
    setView('list');
    setActive(null);
    loadTickets();
  };

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#4834d4,#6c63ff,#a29bfe)', padding: '52px 20px 44px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎧</div>
        <h1 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, marginBottom: 10 }}>Support Center</h1>
        <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 460, margin: '0 auto' }}>
          We're here to help. Create a ticket and our team will get back to you within 24 hours.
        </p>
      </div>

      <div className="container" style={{ padding: '36px 20px 60px', maxWidth: 900 }}>
        {/* Not logged in */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Login to access Support</h2>
            <p style={{ color: '#9e9e9e', marginBottom: 24 }}>You need to be logged in to create and track support tickets.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
              <button className="btn btn-secondary" onClick={() => navigate('/register')}>Create Account</button>
            </div>
          </div>
        ) : (
          <>
            {/* Nav breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#6c63ff', fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0, opacity: view === 'list' ? 0.4 : 1 }} disabled={view === 'list'}>
                🎧 My Tickets
              </button>
              {view !== 'list' && (
                <>
                  <span style={{ color: '#bdbdbd' }}>›</span>
                  <span style={{ fontWeight: 700, color: '#333', fontSize: 14 }}>
                    {view === 'new' ? 'New Ticket' : active?.ticketId || 'Ticket'}
                  </span>
                </>
              )}
            </div>

            {view === 'list' && (
              <TicketList
                tickets={tickets}
                loading={loading}
                onOpen={openTicket}
                onNew={() => setView('new')}
                statusTab={statusTab}
                setStatusTab={setStatusTab}
                search={search}
                setSearch={setSearch}
              />
            )}

            {view === 'new' && (
              <NewTicketForm
                user={user}
                onSubmit={submitNew}
                onCancel={goBack}
                submitting={submitting}
              />
            )}

            {view === 'ticket' && active && (
              <TicketConversation
                ticket={active}
                onBack={() => setView('new')}
                onRefresh={refreshActive}
              />
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
