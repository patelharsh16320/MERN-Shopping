import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactAPI, orderAPI, supportAPI, adminNavAPI } from '../../utils/api';
import { initSocket } from '../../utils/socket';
import { toast } from 'react-toastify';
import AdminChatWidget from '../../components/AdminChatWidget';

const NAV_GROUPS = [
  { group: 1, items: [
    { key: 'dashboard',  icon: '📊', label: 'Dashboard',  path: '/admin' },
  ]},
  { group: 2, items: [
    { key: 'products',   icon: '🌸', label: 'Products',   path: '/admin/products' },
    { key: 'categories', icon: '🏷️', label: 'Categories', path: '/admin/categories' },
  ]},
  { group: 3, items: [
    { key: 'orders',     icon: '📦', label: 'Orders',     path: '/admin/orders' },
    { key: 'invoices',   icon: '🧾', label: 'Invoices',   path: '/admin/invoices' },
    { key: 'coupons',    icon: '🎟️', label: 'Coupons',    path: '/admin/coupons' },
  ]},
  { group: 4, items: [
    { key: 'users',      icon: '👥', label: 'Users',      path: '/admin/users' },
    { key: 'messages',   icon: '💬', label: 'Messages',   path: '/admin/contacts' },
    { key: 'support',    icon: '🎧', label: 'Support',    path: '/admin/support' },
    { key: 'reviews',    icon: '⭐', label: 'Reviews',    path: '/admin/reviews' },
  ]},
  { group: 5, items: [
    { key: 'analytics',    icon: '📈', label: 'Analytics',      path: '/admin/analytics' },
    { key: 'secureData',   icon: '🔐', label: 'Secure Data',    path: '/admin/secure-users' },
    { key: 'importExport', icon: '📂', label: 'Import / Export', path: '/admin/import-export' },
  ]},
  { group: 6, items: [
    { key: 'whatsNew',          icon: '✨', label: "What's New",        path: '/admin/whats-new' },
    { key: 'streakBoard',       icon: '🔥', label: 'Streak Board',      path: '/admin/streaks' },
    { key: 'pages',             icon: '🔘', label: 'Pages',             path: '/admin/pages' },
    { key: 'dashboardSettings', icon: '🧩', label: 'Dashboard Settings', path: '/admin/dashboard-settings' },
    { key: 'pageSpeed',         icon: '⚡', label: 'Page Speed',        path: '/admin/page-speed' },
  ]},
];

// Flat list (same order as above) for badge lookups
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('admin_sidebar_collapsed') === 'true'
  );
  const [badges,        setBadges]        = useState({ messages: 0, orders: 0, support: 0 });
  const [navVisibility, setNavVisibility] = useState(null);
  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem('admin_dark_mode') === 'true');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef(null);

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('admin_dark_mode', String(next));
      return next;
    });
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(v => !v);
    } else {
      setSidebarCollapsed(v => {
        const next = !v;
        localStorage.setItem('admin_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  useEffect(() => {
    adminNavAPI.getAll()
      .then(({ data }) => setNavVisibility(Object.fromEntries(data.map(n => [n.key, n.isActive]))))
      .catch(() => setNavVisibility({}));
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [m, o, s] = await Promise.all([contactAPI.getStats(), orderAPI.getStats(), supportAPI.getStats()]);
        setBadges({ messages: m.data.unread || 0, orders: o.data.pending || 0, support: s.data.unread || 0 });
      } catch {}
    };
    fetch();
  }, [location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored?.token) return;
    const socket = initSocket(stored.token);
    socketRef.current = socket;

    const onNewOrder = (data) => {
      setBadges(prev => ({ ...prev, orders: prev.orders + 1 }));
      toast.info(`📦 New order from ${data.userName} — ₹${data.totalPrice?.toLocaleString('en-IN')}`, { autoClose: 6000 });
    };
    const onNewUser = (data) => toast.info(`👤 New user: ${data.userName}`, { autoClose: 4000 });

    socket.on('new_order', onNewOrder);
    socket.on('new_user',  onNewUser);
    return () => { socket.off('new_order', onNewOrder); socket.off('new_user', onNewUser); };
  }, [user]);

  if (!user || user.role !== 'admin') { navigate('/login'); return null; }

  const badgeFor = (path) =>
    path === '/admin/contacts' ? badges.messages :
    path === '/admin/orders'   ? badges.orders :
    path === '/admin/support'  ? badges.support : 0;

  const isVisible = (key) => key === 'dashboard' || navVisibility === null || navVisibility[key] !== false;

  return (
    <div className="admin-layout" data-admin-theme={darkMode ? 'dark' : 'light'}
      data-sidebar={sidebarCollapsed ? 'collapsed' : 'expanded'}>

      {/* ── Fixed full-width top bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button className="admin-topbar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
              <rect width="18" height="2" rx="1"/><rect y="6" width="18" height="2" rx="1"/><rect y="12" width="18" height="2" rx="1"/>
            </svg>
          </button>
          <Link to="/admin" className="admin-topbar-brand">🌸 Women HubClub</Link>
          <Link to="/" className="admin-topbar-viewstore" title="Open customer store">↗ View Store</Link>
        </div>

        <div className="admin-topbar-right">
          {badges.orders > 0 && (
            <button className="admin-topbar-notif" onClick={() => navigate('/admin/orders')} title={`${badges.orders} pending orders`}>
              📦 <span className="notif-count">{badges.orders > 99 ? '99+' : badges.orders}</span>
            </button>
          )}
          {badges.messages > 0 && (
            <button className="admin-topbar-notif" onClick={() => navigate('/admin/contacts')} title={`${badges.messages} unread messages`}>
              💬 <span className="notif-count">{badges.messages > 99 ? '99+' : badges.messages}</span>
            </button>
          )}
          {badges.support > 0 && (
            <button className="admin-topbar-notif" onClick={() => navigate('/admin/support')} title={`${badges.support} open tickets`}>
              🎧 <span className="notif-count">{badges.support > 99 ? '99+' : badges.support}</span>
            </button>
          )}
          <button className="admin-dark-toggle" onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div className="admin-topbar-user" onClick={() => navigate('/admin')}>
            <div className="admin-topbar-avatar">{user.name?.[0]?.toUpperCase()}</div>
            <span className="admin-topbar-username">{user.name.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      <div className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)} />

      {/* ── Fixed sidebar ── */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter(item => isVisible(item.key));
            if (!visibleItems.length) return null;
            return (
              <React.Fragment key={group.group}>
                {gi > 0 && <div className="sidebar-sep" />}
                {visibleItems.map(item => {
                  const badge = badgeFor(item.path);
                  const active = location.pathname === item.path ||
                    (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <Link key={item.path} to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`sidebar-item ${active ? 'active' : ''}`}
                      title={sidebarCollapsed ? item.label : ''}>
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span className="sidebar-item-label">{item.label}</span>
                      {badge > 0 && <span className="sidebar-badge">{badge > 99 ? '99+' : badge}</span>}
                    </Link>
                  );
                })}
              </React.Fragment>
            );
          })}

          <div className="sidebar-sep" />
          <Link to="/" className="sidebar-item" title={sidebarCollapsed ? 'View Store' : ''}>
            <span className="sidebar-item-icon">🏠</span>
            <span className="sidebar-item-label">View Store</span>
          </Link>
          <div className="sidebar-item sidebar-item-danger"
            onClick={() => setShowLogoutConfirm(true)}
            title={sidebarCollapsed ? 'Logout' : ''}>
            <span className="sidebar-item-icon">🚪</span>
            <span className="sidebar-item-label">Logout</span>
          </div>
        </nav>

        {/* Collapse button (desktop) */}
        <button className="sidebar-collapse-btn" onClick={() => {
          const next = !sidebarCollapsed;
          setSidebarCollapsed(next);
          localStorage.setItem('admin_sidebar_collapsed', String(next));
        }}>
          <span className="sidebar-item-icon">{sidebarCollapsed ? '▶' : '◀'}</span>
          <span className="sidebar-item-label">Collapse menu</span>
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-content">
        <div className="admin-page-content">
          {children}
        </div>
      </main>

      <AdminChatWidget />

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-icon">🚪</div>
            <h3 className="admin-modal-title">Logout?</h3>
            <p className="admin-modal-text">Are you sure you want to logout from the admin panel?</p>
            <div className="admin-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { setShowLogoutConfirm(false); logout(); navigate('/'); }}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
