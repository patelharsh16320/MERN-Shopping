import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactAPI, orderAPI, supportAPI, adminNavAPI } from '../../utils/api';
import { initSocket } from '../../utils/socket';
import { toast } from 'react-toastify';
import AdminChatWidget from '../../components/AdminChatWidget';

const navItems = [
  { key: 'dashboard',         icon: '📊', label: 'Dashboard', path: '/admin' },
  { key: 'products',          icon: '🌸', label: 'Products', path: '/admin/products' },
  { key: 'categories',        icon: '🏷️', label: 'Categories', path: '/admin/categories' },
  { key: 'users',             icon: '👥', label: 'Users', path: '/admin/users' },
  { key: 'orders',            icon: '📦', label: 'Orders', path: '/admin/orders' },
  { key: 'invoices',          icon: '🧾', label: 'Invoices', path: '/admin/invoices' },
  { key: 'analytics',         icon: '📈', label: 'Analytics', path: '/admin/analytics' },
  { key: 'messages',          icon: '💬', label: 'Messages', path: '/admin/contacts' },
  { key: 'reviews',           icon: '⭐', label: 'Reviews', path: '/admin/reviews' },
  { key: 'coupons',           icon: '🎟️', label: 'Coupons', path: '/admin/coupons' },
  { key: 'secureData',        icon: '🔐', label: 'Secure Data', path: '/admin/secure-users' },
  { key: 'importExport',      icon: '📂', label: 'Import / Export', path: '/admin/import-export' },
  { key: 'whatsNew',          icon: '✨', label: "What's New", path: '/admin/whats-new' },
  { key: 'streakBoard',       icon: '🔥', label: 'Streak Board', path: '/admin/streaks' },
  { key: 'support',           icon: '🎧', label: 'Support', path: '/admin/support' },
  { key: 'pages',             icon: '🔘', label: 'Pages', path: '/admin/pages' },
  { key: 'dashboardSettings', icon: '🧩', label: 'Dashboard Settings', path: '/admin/dashboard-settings' },
  { key: 'pageSpeed',         icon: '⚡', label: 'Page Speed', path: '/admin/page-speed' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({ messages: 0, orders: 0, support: 0 });
  const [navVisibility, setNavVisibility] = useState(null);
  const socketRef = useRef(null);

  // Fetch sidebar nav visibility once
  useEffect(() => {
    adminNavAPI.getAll()
      .then(({ data }) => setNavVisibility(Object.fromEntries(data.map(n => [n.key, n.isActive]))))
      .catch(() => setNavVisibility({}));
  }, []);

  // Fetch badge counts on every route change
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [msgRes, ordRes, supRes] = await Promise.all([contactAPI.getStats(), orderAPI.getStats(), supportAPI.getStats()]);
        setBadges({ messages: msgRes.data.unread || 0, orders: ordRes.data.pending || 0, support: supRes.data.unread || 0 });
      } catch {}
    };
    fetchBadges();
  }, [location.pathname]);

  // Live socket listeners — increment badges without page refresh
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored?.token) return;
    const socket = initSocket(stored.token);
    socketRef.current = socket;

    const onNewOrder = (data) => {
      setBadges(prev => ({ ...prev, orders: prev.orders + 1 }));
      toast.info(
        `📦 New order from ${data.userName} — ₹${data.totalPrice?.toLocaleString('en-IN')} (${data.itemCount} item${data.itemCount !== 1 ? 's' : ''})`,
        { autoClose: 6000, position: 'top-right' }
      );
    };

    const onNewUser = (data) => {
      toast.info(`👤 New user registered: ${data.userName}`, { autoClose: 4000, position: 'top-right' });
    };

    socket.on('new_order', onNewOrder);
    socket.on('new_user',  onNewUser);

    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('new_user',  onNewUser);
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Sidebar overlay (mobile) */}
      <div className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      <div className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">🌸 Admin Panel</div>
        <div style={{ padding: '0 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, marginBottom: 8 }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user.email}</div>
        </div>

        {navItems.filter(item => item.key === 'dashboard' || navVisibility === null || navVisibility[item.key] !== false).map(item => {
          const badge = item.path === '/admin/contacts' ? badges.messages
                      : item.path === '/admin/orders' ? badges.orders
                      : item.path === '/admin/support' ? badges.support
                      : 0;
          return (
            <Link key={item.path} to={item.path} onClick={closeSidebar}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
              {badge > 0 && (
                <span style={{ marginLeft: 'auto', background: '#d63031', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 16, paddingTop: 16 }}>
          <Link to="/" className="sidebar-item" onClick={closeSidebar}><span>🏠</span> View Store</Link>
          <div className="sidebar-item" onClick={() => { logout(); navigate('/'); }} style={{ color: '#fd79a8' }}>
            <span>🚪</span> Logout
          </div>
        </div>
      </div>

      <div className="admin-content">
        {/* Mobile top bar */}
        <div className="admin-mobile-toggle">
          <button onClick={() => setSidebarOpen(v => !v)}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#c2185b' }}>🌸 Admin Panel</span>
        </div>
        <div className="admin-page-content">
          {children}
        </div>
      </div>
      <AdminChatWidget />
    </div>
  );
}
