import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { initSocket } from '../utils/socket';
import API from '../utils/api';
import { toast } from 'react-toastify';

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
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9998 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 62, right: 0,
          width: 340, height: 500,
          background: 'white', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #e0e0e0',
          animation: 'zoomIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#6c63ff,#a29bfe)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {view === 'chat' && (
              <button onClick={backToList} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>←</button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                {view === 'chat' ? activeRoom?.userName : 'Support Chats'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                {view === 'list'
                  ? `${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}`
                  : onlineUsers.has(activeRoom?.userId) ? '🟢 Online' : '⚫ Offline'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* List view */}
          {view === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9e9e9e' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>No chats yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Users will appear here when they start a chat</div>
                </div>
              ) : sessions.map(s => {
                const isOnline = onlineUsers.has(s._id);
                return (
                  <div key={s._id} onClick={() => openRoom(s._id, s.user?.name || 'User')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                        {(s.user?.name || '?')[0].toUpperCase()}
                      </div>
                      {isOnline && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#69f0ae', border: '2px solid white' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#212121' }}>{s.user?.name || 'Unknown'}</span>
                        <span style={{ fontSize: 10, color: '#bdbdbd' }}>{fmtDate(s.lastMessage?.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#9e9e9e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {s.lastMessage?.senderRole === 'admin' && <span style={{ color: '#6c63ff' }}>You: </span>}
                        {s.lastMessage?.message}
                      </div>
                    </div>
                    {s.unread > 0 && (
                      <span style={{ background: '#d63031', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9e9e9e', padding: '30px 20px', fontSize: 13 }}>
                    Start the conversation with {activeRoom?.userName}
                  </div>
                )}
                {messages.map((m, i) => {
                  const isAdmin = m.senderRole === 'admin';
                  return (
                    <div key={m._id || i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '78%' }}>
                        <div style={{ padding: '9px 13px', borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isAdmin ? 'linear-gradient(135deg,#6c63ff,#a29bfe)' : '#f5f5f5', color: isAdmin ? 'white' : '#212121', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {m.message}
                        </div>
                        <div style={{ fontSize: 10, color: '#bdbdbd', marginTop: 2, textAlign: isAdmin ? 'right' : 'left', paddingLeft: isAdmin ? 0 : 4, paddingRight: isAdmin ? 4 : 0 }}>
                          {fmt(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: '#f5f5f5', borderRadius: '16px 16px 16px 4px', padding: '8px 14px', display: 'flex', gap: 4 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c63ff', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '10px 12px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey} placeholder="Reply… (Enter to send)" rows={1}
                  style={{ flex: 1, resize: 'none', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', maxHeight: 80, overflowY: 'auto', lineHeight: 1.4 }} />
                <button onClick={sendMessage} disabled={!input.trim()}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: input.trim() ? 'linear-gradient(135deg,#6c63ff,#a29bfe)' : '#f5f5f5', color: input.trim() ? 'white' : '#bdbdbd', cursor: input.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button — badge always visible while there are unread messages */}
      <button onClick={() => { setOpen(v => !v); if (!open) loadSessions(); }}
        style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#6c63ff,#a29bfe)', color: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 18px rgba(108,99,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {open ? '✕' : '💬'}
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#d63031', color: 'white', borderRadius: '50%', minWidth: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', padding: '0 3px', animation: 'pulse 1.5s ease-in-out infinite' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
