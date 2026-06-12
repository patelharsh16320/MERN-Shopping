import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search)}`); setMobileOpen(false); }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const close = () => { setMobileOpen(false); setDropOpen(false); };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">💗 Women HubClub</Link>

          <form onSubmit={handleSearch} className="nav-search">
            <span style={{ color: '#bdbdbd' }}>🔍</span>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </form>

          <ul className="navbar-nav">
            <li><Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link></li>
            <li><Link to="/products" className={`nav-link ${isActive('/products')}`}>Shop</Link></li>
            <li><Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link></li>
            <li><Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link></li>
            <li>
              <Link to="/cart" className="nav-link" style={{ position: 'relative', padding: '7px 13px' }}>
                <span className="cart-badge">
                  🛒 Cart
                  {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
                </span>
              </Link>
            </li>
            {user ? (
              <>
                <li><Link to="/wishlist" className={`nav-link ${isActive('/wishlist')}`}>🤍 Wishlist</Link></li>
                <li className="user-menu" ref={dropRef}>
                  <button className="btn btn-primary btn-sm" onClick={() => setDropOpen(!dropOpen)}>
                    👤 {user.name.split(' ')[0]}
                  </button>
                  {dropOpen && (
                    <div className="user-dropdown">
                      <div style={{ padding: '8px 14px 12px', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#757575' }}>{user.email}</div>
                        <span className={`badge badge-${user.role}`} style={{ marginTop: '4px' }}>{user.role}</span>
                      </div>
                      {user.role === 'admin' && <Link to="/admin" className="dropdown-item" onClick={close}>⚙️ Admin Dashboard</Link>}
                      <Link to="/orders" className="dropdown-item" onClick={close}>📦 My Orders</Link>
                      <Link to="/invoices" className="dropdown-item" onClick={close}>🧾 My Invoices</Link>
                      <Link to="/wishlist" className="dropdown-item" onClick={close}>🤍 Wishlist</Link>
                      <Link to="/profile" className="dropdown-item" onClick={close}>👤 Profile</Link>
                      <div className="dropdown-item" onClick={() => { logout(); close(); navigate('/'); }} style={{ color: '#c62828' }}>🚪 Logout</div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login" className={`nav-link ${isActive('/login')}`}>Login</Link></li>
                <li><Link to="/register" className="btn btn-primary btn-sm">Join Now</Link></li>
              </>
            )}
          </ul>

          {/* Mobile right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-right">
            <Link to="/cart" className="nav-link" style={{ position: 'relative', padding: '7px 10px' }}>
              <span className="cart-badge">
                🛒
                {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </span>
            </Link>
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile nav drawer */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearch} className="mobile-nav-search">
          <span style={{ color: '#bdbdbd' }}>🔍</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <Link to="/" className="nav-link" onClick={close}>🏠 Home</Link>
        <Link to="/products" className="nav-link" onClick={close}>🛍️ Shop</Link>
        <Link to="/about" className="nav-link" onClick={close}>💫 About</Link>
        <Link to="/contact" className="nav-link" onClick={close}>📞 Contact</Link>
        {user ? (
          <>
            <Link to="/wishlist" className="nav-link" onClick={close}>🤍 Wishlist</Link>
            <Link to="/orders" className="nav-link" onClick={close}>📦 My Orders</Link>
            <Link to="/profile" className="nav-link" onClick={close}>👤 Profile ({user.name.split(' ')[0]})</Link>
            {user.role === 'admin' && <Link to="/admin" className="nav-link" onClick={close}>⚙️ Admin Panel</Link>}
            <div className="nav-link" style={{ color: '#c62828', cursor: 'pointer' }} onClick={() => { logout(); close(); navigate('/'); }}>🚪 Logout</div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={close}>🔑 Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ margin: '4px 0' }} onClick={close}>Join Now</Link>
          </>
        )}
      </div>
    </>
  );
}
