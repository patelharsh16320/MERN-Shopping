import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactAPI, orderAPI } from '../../utils/api';

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/admin' },
  { icon: '🌸', label: 'Products', path: '/admin/products' },
  { icon: '🏷️', label: 'Categories', path: '/admin/categories' },
  { icon: '👥', label: 'Users', path: '/admin/users' },
  { icon: '📦', label: 'Orders', path: '/admin/orders' },
  { icon: '🧾', label: 'Invoices', path: '/admin/invoices' },
  { icon: '📈', label: 'Analytics', path: '/admin/analytics' },
  { icon: '💬', label: 'Messages', path: '/admin/contacts' },
  { icon: '⭐', label: 'Reviews', path: '/admin/reviews' },
  { icon: '🎟️', label: 'Coupons', path: '/admin/coupons' },
  { icon: '🔐', label: 'Secure Data', path: '/admin/secure-users' },
  { icon: '📂', label: 'Import / Export', path: '/admin/import-export' },
  { icon: '✨', label: "What's New", path: '/admin/whats-new' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({ messages: 0, orders: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [msgRes, ordRes] = await Promise.all([contactAPI.getStats(), orderAPI.getStats()]);
        setBadges({ messages: msgRes.data.unread || 0, orders: ordRes.data.pending || 0 });
      } catch {}
    };
    fetchBadges();
  }, [location.pathname]);

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

        {navItems.map(item => {
          const badge = item.path === '/admin/contacts' ? badges.messages
                      : item.path === '/admin/orders' ? badges.orders
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
    </div>
  );
}
