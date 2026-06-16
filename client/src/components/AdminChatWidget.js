import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { initSocket } from '../utils/socket';
import API from '../utils/api';
import { toast } from 'react-toastify';
import './AdminChatWidget.css';

const fmt = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => {
  const now = new Date(), dt = new Date(d);
  const sameDay = now.toDateString() === dt.toDateString();
  return sameDay ? fmt(d) : dt.toLocaleDateString('en-IN', { dateStyle: 'short' });
};

export default function AdminChatWidget() {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState('list'); // 'list' | 'chat'
  const [sessions, setSessions]   = useState([]);
  const [activeRoom, setActiveRoom] = useState(null); // { userId, userName }
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [unread, setUnread]       = useState(0);
  const [userTyping, setUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef   = useRef(null);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const activeRoomRef = useRef(activeRoom);
  activeRoomRef.current = activeRoom;

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await API.get('/chat/sessions');
      setSessions(data);
      const total = data.reduce((s, d) => s + (d.unread || 0), 0);
      setUnread(total);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored?.token) return;

    const socket = initSocket(stored.token);
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      // Always refresh sessions so per-session unread counts + badge stay current
      loadSessions();
      // If we are viewing this exact room, append inline and mark read
      if (activeRoomRef.current?.userId === msg.room) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollBottom();
        API.put(`/chat/read/${msg.room}`).catch(() => {});
      }
    });

    socket.on('chat_notification', ({ roomUserId, userName, message }) => {
      if (!activeRoomRef.current || activeRoomRef.current.userId !== roomUserId) {
        toast.info(`💬 ${userName}: ${message.slice(0, 50)}`, {
          autoClose: 5000,
          onClick: () => { setOpen(true); openRoom(roomUserId, userName); },
        });
      }
      loadSessions();
    });

    socket.on('peer_typing', ({ senderRole, isTyping, roomUserId }) => {
      if (senderRole === 'user' && activeRoomRef.current?.userId === roomUserId) {
        setUserTyping(isTyping);
      }
    });

    socket.on('user_online', ({ userId, userName }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
    });

    loadSessions();

    return () => {
      socket.off('new_message');
      socket.off('chat_notification');
      socket.off('peer_typing');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [user, loadSessions, scrollBottom]);

  if (!user || user.role !== 'admin') return null;

  const openRoom = async (userId, userName) => {
    setActiveRoom({ userId, userName });
    setView('chat');
    setUserTyping(false);
    try {
      const { data } = await API.get(`/chat/history/${userId}`);
      setMessages(data);
      await API.put(`/chat/read/${userId}`);
      await loadSessions();
      if (socketRef.current) socketRef.current.emit('admin_join_room', userId);
      scrollBottom();
    } catch {}
  };

  const backToList = () => {
    if (activeRoom && socketRef.current) socketRef.current.emit('admin_leave_room', activeRoom.userId);
    setView('list');
    setActiveRoom(null);
    setMessages([]);
    loadSessions();
  };

  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !socketRef.current || !activeRoom) return;
    socketRef.current.emit('send_message', { roomUserId: activeRoom.userId, message: msg });
    socketRef.current.emit('typing_stop', { roomUserId: activeRoom.userId });
    setInput('');
    clearTimeout(typingTimer.current);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('typing_start', { roomUserId: activeRoom.userId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing_stop', { roomUserId: activeRoom.userId }), 2000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="admin-chat-wrap">
      {open && (
        <div className="admin-chat-panel">
          {/* Header */}
          <div className="admin-chat-header">
            {view === 'chat' && (
              <button onClick={backToList} className="admin-chat-back-btn">←</button>
            )}
            <div className="admin-chat-header-info">
              <div className="admin-chat-header-title">
                {view === 'chat' ? activeRoom?.userName : 'Support Chats'}
              </div>
              <div className="admin-chat-header-sub">
                {view === 'list'
                  ? `${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}`
                  : onlineUsers.has(activeRoom?.userId) ? '🟢 Online' : '⚫ Offline'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="admin-chat-close-btn">✕</button>
          </div>

          {/* List view */}
          {view === 'list' && (
            <div className="admin-chat-list">
              {sessions.length === 0 ? (
                <div className="admin-chat-empty">
                  <div className="admin-chat-empty-icon">💬</div>
                  <div className="admin-chat-empty-title">No chats yet</div>
                  <div className="admin-chat-empty-sub">Users will appear here when they start a chat</div>
                </div>
              ) : sessions.map(s => {
                const isOnline = onlineUsers.has(s._id);
                return (
                  <div key={s._id} onClick={() => openRoom(s._id, s.user?.name || 'User')}
                    className="admin-chat-session">
                    <div className="admin-chat-avatar-wrap">
                      <div className="admin-chat-avatar">
                        {(s.user?.name || '?')[0].toUpperCase()}
                      </div>
                      {isOnline && <span className="admin-chat-online-dot" />}
                    </div>
                    <div className="admin-chat-session-body">
                      <div className="admin-chat-session-top">
                        <span className="admin-chat-session-name">{s.user?.name || 'Unknown'}</span>
                        <span className="admin-chat-session-time">{fmtDate(s.lastMessage?.createdAt)}</span>
                      </div>
                      <div className="admin-chat-session-preview">
                        {s.lastMessage?.senderRole === 'admin' && <span className="admin-chat-session-you">You: </span>}
                        {s.lastMessage?.message}
                      </div>
                    </div>
                    {s.unread > 0 && (
                      <span className="admin-chat-session-unread">
                        {s.unread}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat view */}
          {view === 'chat' && (
            <>
              <div className="admin-chat-messages">
                {messages.length === 0 && (
                  <div className="admin-chat-messages-empty">
                    Start the conversation with {activeRoom?.userName}
                  </div>
                )}
                {messages.map((m, i) => {
                  const isAdmin = m.senderRole === 'admin';
                  const side = isAdmin ? 'is-admin' : 'is-user';
                  return (
                    <div key={m._id || i} className={`admin-chat-msg-row ${side}`}>
                      <div className="admin-chat-msg-bubble-wrap">
                        <div className={`admin-chat-msg-bubble ${side}`}>
                          {m.message}
                        </div>
                        <div className={`admin-chat-msg-time ${side}`}>
                          {fmt(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userTyping && (
                  <div className="admin-chat-typing-row">
                    <div className="admin-chat-typing-bubble">
                      {[0,1,2].map(i => <span key={i} className="admin-chat-typing-dot" />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="admin-chat-input-row">
                <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey} placeholder="Reply… (Enter to send)" rows={1}
                  className="admin-chat-textarea" />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className={`admin-chat-send-btn ${input.trim() ? 'active' : ''}`}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button — badge always visible while there are unread messages */}
      <button onClick={() => { setOpen(v => !v); if (!open) loadSessions(); }}
        className="admin-chat-fab">
        {open ? '✕' : '💬'}
        {unread > 0 && (
          <span className="admin-chat-fab-badge">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
