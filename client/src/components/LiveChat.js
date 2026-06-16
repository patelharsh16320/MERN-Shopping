import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { initSocket } from '../utils/socket';
import API, { orderAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './LiveChat.css';

const fmt      = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

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
    <div className="livechat-orders-loading">
      Loading orders…
    </div>
  );

  if (orders.length === 0) return (
    <div className="livechat-orders-empty">
      <div className="livechat-orders-empty-icon">📭</div>
      <div className="livechat-orders-empty-title">No orders yet</div>
      <div className="livechat-orders-empty-sub">Your orders will appear here after purchase</div>
    </div>
  );

  return (
    <div className="livechat-orders-list">
      {orders.map(order => {
        const st        = order.orderStatus || 'Pending';
        const stepIdx   = STATUS_STEPS.indexOf(st);
        const cancelled = st === 'Cancelled';
        const isExp     = expanded === order._id;

        return (
          <div key={order._id} className={`livechat-order-card status-${st.toLowerCase()}`}>

            <div className="livechat-order-header" onClick={() => setExpanded(isExp ? null : order._id)}>
              <div>
                <div className="livechat-order-id">
                  #{String(order._id).slice(-8).toUpperCase()}
                </div>
                <div className="livechat-order-date">{fmtDate(order.createdAt)}</div>
              </div>
              <div className="livechat-order-header-right">
                <span className="livechat-order-status">{st}</span>
                <span className="livechat-order-total">₹{order.totalPrice?.toLocaleString()}</span>
                <span className="livechat-order-arrow">{isExp ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExp && (
              <div className="livechat-order-body">
                {!cancelled ? (
                  <div className="livechat-progress-track">
                    {STATUS_STEPS.map((s, i) => {
                      const done    = i <= stepIdx;
                      const current = i === stepIdx;
                      return (
                        <React.Fragment key={s}>
                          <div className="livechat-progress-step">
                            <div className={`livechat-progress-dot ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                              {done && !current ? '✓' : i + 1}
                            </div>
                            <div className={`livechat-progress-label ${done ? 'done' : ''} ${current ? 'current' : ''}`}>{s}</div>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`livechat-progress-line ${i < stepIdx ? 'done' : ''}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <div className="livechat-cancelled-banner">
                    <span className="livechat-cancelled-icon">❌</span>
                    <span className="livechat-cancelled-text">This order was cancelled</span>
                  </div>
                )}

                {(order.orderItems || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="livechat-item-row">
                    <img src={item.image || '/placeholder.png'} alt={item.name} className="livechat-item-img" />
                    <div className="livechat-item-body">
                      <div className="livechat-item-name">{item.name}</div>
                      <div className="livechat-item-meta">Qty: {item.quantity} · ₹{item.price?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {(order.orderItems?.length || 0) > 3 && (
                  <div className="livechat-item-more">+{order.orderItems.length - 3} more item(s)</div>
                )}

                <div className="livechat-order-footer">
                  <span>Payment: {order.paymentMethod}</span>
                  <span className="livechat-order-footer-total">Total: ₹{order.totalPrice?.toLocaleString()}</span>
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

  return (
    <div className="livechat-wrap">
      {open && (
        <div className="livechat-panel">
          {/* Header */}
          <div className="livechat-header">
            <div className="livechat-header-top">
              <div className="livechat-header-avatar">🌸</div>
              <div className="livechat-header-info">
                <div className="livechat-header-title">Women HubClub Support</div>
                <div className="livechat-header-status">
                  <span className={`livechat-status-dot ${connected ? 'online' : 'offline'}`} />
                  {connected ? 'Online' : 'Connecting...'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="livechat-close-btn">✕</button>
            </div>

            {/* Tabs */}
            <div className="livechat-tabs">
              {[
                { key: 'chat',   label: '💬 Chat',     badge: chatUnread },
                { key: 'orders', label: '📦 My Orders', badge: 0 },
              ].map(t => (
                <button key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`livechat-tab ${tab === t.key ? 'active' : ''}`}>
                  {t.label}
                  {t.badge > 0 && (
                    <span className="livechat-tab-badge">
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
              <div className="livechat-messages">
                {messages.length === 0 && (
                  <div className="livechat-messages-empty">
                    <div className="livechat-messages-empty-icon">👋</div>
                    Hi {user.name.split(' ')[0]}! How can we help you today?
                    <div>
                      <button onClick={() => setTab('orders')} className="livechat-track-btn">
                        📦 Track my orders
                      </button>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.senderRole === 'user';
                  const side = isMe ? 'is-me' : 'is-other';
                  return (
                    <div key={m._id || i} className={`livechat-msg-row ${side}`}>
                      <div className="livechat-msg-bubble-wrap">
                        <div className={`livechat-msg-bubble ${side}`}>
                          {m.message}
                        </div>
                        <div className={`livechat-msg-time ${side}`}>
                          {fmt(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {adminTyping && (
                  <div className="livechat-typing-row">
                    <div className="livechat-typing-bubble">
                      {[0,1,2].map(i => <span key={i} className="livechat-typing-dot" />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="livechat-input-row">
                <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey} placeholder="Type a message… (Enter to send)" rows={1}
                  className="livechat-textarea" />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className={`livechat-send-btn ${input.trim() ? 'active' : ''}`}>
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
        className="livechat-fab">
        {open ? '✕' : '💬'}
        {unread > 0 && (
          <span className="livechat-fab-badge">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
