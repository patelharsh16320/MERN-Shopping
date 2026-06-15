import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { initSocket } from '../utils/socket';
import API, { orderAPI } from '../utils/api';
import { toast } from 'react-toastify';

const fmt      = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const STATUS_COLOR = {
  Pending:    { bg: '#fff8e1', color: '#f57f17', dot: '#ffc107' },
  Processing: { bg: '#e3f2fd', color: '#1565c0', dot: '#42a5f5' },
  Shipped:    { bg: '#e8f5e9', color: '#2e7d32', dot: '#66bb6a' },
  Delivered:  { bg: '#f3e5f5', color: '#6a1b9a', dot: '#ab47bc' },
  Cancelled:  { bg: '#ffebee', color: '#c62828', dot: '#ef5350' },
};

const lastReadKey = (uid) => `chat_lastRead_${uid}`;

function OrdersTab() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e', fontSize: 13 }}>
      Loading orders…
    </div>
  );

  if (orders.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e', padding: 20 }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>No orders yet</div>
      <div style={{ fontSize: 12 }}>Your orders will appear here after purchase</div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px' }}>
      {orders.map(order => {
        const st        = order.orderStatus || 'Pending';
        const colors    = STATUS_COLOR[st] || STATUS_COLOR.Pending;
        const stepIdx   = STATUS_STEPS.indexOf(st);
        const cancelled = st === 'Cancelled';
        const isExp     = expanded === order._id;

        return (
          <div key={order._id}
            style={{ border: '1.5px solid #f0f0f0', borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

            <div style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
              onClick={() => setExpanded(isExp ? null : order._id)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#2d3436' }}>
                  #{String(order._id).slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 1 }}>{fmtDate(order.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: colors.bg, color: colors.color, fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{st}</span>
                <span style={{ color: '#9e9e9e', fontSize: 12, fontWeight: 700 }}>₹{order.totalPrice?.toLocaleString()}</span>
                <span style={{ color: '#bdbdbd', fontSize: 12 }}>{isExp ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExp && (
              <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 12px', background: '#fafafa' }}>
                {!cancelled ? (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    {STATUS_STEPS.map((s, i) => {
                      const done    = i <= stepIdx;
                      const current = i === stepIdx;
                      return (
                        <React.Fragment key={s}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? (current ? colors.dot : '#00b894') : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, boxShadow: current ? `0 0 0 3px ${colors.bg}` : 'none', transition: 'all 0.3s' }}>
                              {done && !current ? '✓' : i + 1}
                            </div>
                            <div style={{ fontSize: 9, color: done ? '#2d3436' : '#9e9e9e', marginTop: 3, fontWeight: current ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</div>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#00b894' : '#e0e0e0', margin: '0 2px', marginBottom: 16, transition: 'background 0.3s' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: '#ffebee', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 16 }}>❌</span>
                    <span style={{ color: '#c62828', fontWeight: 700, fontSize: 12 }}>This order was cancelled</span>
                  </div>
                )}

                {(order.orderItems || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <img src={item.image || '/placeholder.png'} alt={item.name} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#2d3436', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#9e9e9e' }}>Qty: {item.quantity} · ₹{item.price?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {(order.orderItems?.length || 0) > 3 && (
                  <div style={{ fontSize: 11, color: '#9e9e9e', marginBottom: 6 }}>+{order.orderItems.length - 3} more item(s)</div>
                )}

                <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#636e72' }}>
                  <span>Payment: {order.paymentMethod}</span>
                  <span style={{ fontWeight: 700, color: '#c2185b' }}>Total: ₹{order.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen]               = useState(false);
  const [tab, setTab]                 = useState('chat');
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [unread, setUnread]           = useState(0);
  const [chatUnread, setChatUnread]   = useState(0); // unread on chat tab specifically
  const [adminTyping, setAdminTyping] = useState(false);
  const [connected, setConnected]     = useState(false);

  const socketRef   = useRef(null);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const openRef     = useRef(open);
  const tabRef      = useRef(tab);
  openRef.current   = open;
  tabRef.current    = tab;

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  // Mark chat as read — saves timestamp to localStorage so count survives navigation
  const markChatRead = useCallback(() => {
    if (!user) return;
    localStorage.setItem(lastReadKey(user._id), String(Date.now()));
    setUnread(0);
    setChatUnread(0);
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored?.token) return;

    const socket = initSocket(stored.token);
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg) => {
      if (msg.room !== user._id) return;

      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Only increment if the message is from admin
      if (msg.senderRole === 'admin') {
        const chatVisible = openRef.current && tabRef.current === 'chat';
        if (!chatVisible) {
          // Increment both the floating button badge AND the chat tab indicator
          setUnread(u => u + 1);
          setChatUnread(u => u + 1);
          toast.info(`💬 Support: ${msg.message.slice(0, 60)}`, { autoClose: 4000 });
        } else {
          // Chat is open and visible — mark as read immediately
          markChatRead();
        }
      }
      scrollBottom();
    });

    socket.on('peer_typing', ({ senderRole, isTyping }) => {
      if (senderRole === 'admin') setAdminTyping(isTyping);
    });

    // Load history + compute initial unread from localStorage timestamp
    API.get('/chat/history').then(({ data }) => {
      setMessages(data);
      const lastRead = parseInt(localStorage.getItem(lastReadKey(user._id)) || '0', 10);
      const count = data.filter(m => m.senderRole === 'admin' && new Date(m.createdAt).getTime() > lastRead).length;
      setUnread(count);
      setChatUnread(count);
    }).catch(() => {});

    return () => {
      socket.off('new_message');
      socket.off('peer_typing');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [user, scrollBottom, markChatRead]);

  // When switching to chat tab while open — clear count
  useEffect(() => {
    if (open && tab === 'chat') {
      markChatRead();
      scrollBottom();
    }
  }, [open, tab, markChatRead, scrollBottom]);

  if (!user || user.role === 'admin') return null;

  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit('send_message', { message: msg });
    socketRef.current.emit('typing_stop', {});
    setInput('');
    clearTimeout(typingTimer.current);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing_start', {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing_stop', {}), 2000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const badgeStyle = {
    position: 'absolute', top: -4, right: -4,
    background: '#d63031', color: 'white',
    borderRadius: '50%', minWidth: 20, height: 20,
    fontSize: 11, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid white', padding: '0 3px',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9998 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 62, right: 0,
          width: 340, height: 520,
          background: 'white', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #f8bbd0',
          animation: 'zoomIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#c2185b,#e91e63)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🌸</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Women HubClub Support</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#69f0ae' : '#ffcc02', display: 'inline-block' }} />
                  {connected ? 'Online' : 'Connecting...'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 3, gap: 2 }}>
              {[
                { key: 'chat',   label: '💬 Chat',     badge: chatUnread },
                { key: 'orders', label: '📦 My Orders', badge: 0 },
              ].map(t => (
                <button key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1, padding: '6px 0', border: 'none', borderRadius: 10,
                    background: tab === t.key ? 'white' : 'transparent',
                    color: tab === t.key ? '#c2185b' : 'rgba(255,255,255,0.85)',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.2s', position: 'relative',
                  }}>
                  {t.label}
                  {t.badge > 0 && (
                    <span style={{ marginLeft: 5, background: '#d63031', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                      {t.badge > 99 ? '99+' : t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat tab */}
          {tab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9e9e9e', padding: '30px 20px', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
                    Hi {user.name.split(' ')[0]}! How can we help you today?
                    <div style={{ marginTop: 10 }}>
                      <button onClick={() => setTab('orders')} style={{ background: '#fce4ec', border: 'none', color: '#c2185b', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                        📦 Track my orders
                      </button>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.senderRole === 'user';
                  return (
                    <div key={m._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '78%' }}>
                        <div style={{ padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? 'linear-gradient(135deg,#c2185b,#e91e63)' : '#f5f5f5', color: isMe ? 'white' : '#212121', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {m.message}
                        </div>
                        <div style={{ fontSize: 10, color: '#bdbdbd', marginTop: 2, textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                          {fmt(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {adminTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: '#f5f5f5', borderRadius: '16px 16px 16px 4px', padding: '8px 14px', display: 'flex', gap: 4 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c2185b', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: '10px 12px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey} placeholder="Type a message… (Enter to send)" rows={1}
                  style={{ flex: 1, resize: 'none', border: '1.5px solid #f8bbd0', borderRadius: 12, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', maxHeight: 80, overflowY: 'auto', lineHeight: 1.4 }} />
                <button onClick={sendMessage} disabled={!input.trim()}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: input.trim() ? 'linear-gradient(135deg,#c2185b,#e91e63)' : '#f5f5f5', color: input.trim() ? 'white' : '#bdbdbd', cursor: input.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  ➤
                </button>
              </div>
            </>
          )}

          {/* Orders tab */}
          {tab === 'orders' && <OrdersTab />}
        </div>
      )}

      {/* Floating button — badge shows whenever unread > 0, even while open (e.g. on orders tab) */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#c2185b,#e91e63)', color: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 18px rgba(194,24,91,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {open ? '✕' : '💬'}
        {unread > 0 && (
          <span style={badgeStyle}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
