import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 10);
      if (current < 80) {
        setNavVisible(true);
      } else if (current > lastScrollY.current + 6) {
        setNavVisible(false);
        setDropOpen(false);
      } else if (current < lastScrollY.current - 4) {
        setNavVisible(true);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search)}`); setMobileOpen(false); }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const close = () => { setMobileOpen(false); setDropOpen(false); };

  return (
    <>
      <nav className={`navbar${!navVisible ? ' navbar-hidden' : ''}${scrolled ? ' navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">💗 Women HubClub</Link>

          <form onSubmit={handleSearch} className="nav-search">
            <span className="nav-search-icon">🔍</span>
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </form>

          <ul className="navbar-nav">
            <li><Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link></li>
            <li><Link to="/products" className={`nav-link ${isActive('/products')}`}>Shop</Link></li>
            <li><Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link></li>
            <li><Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link></li>
            <li><Link to="/offers" className={`nav-link ${isActive('/offers')}`}>🔥 Offers</Link></li>
            <li><Link to="/quiz" className={`nav-link ${isActive('/quiz')}`}>✨ Quiz</Link></li>
            {user ? (
              <>
                <li><Link to="/wishlist" className={`nav-link ${isActive('/wishlist')}`}>🤍 Wishlist</Link></li>
                <li className="user-menu" ref={dropRef}>
                  <button className="btn btn-primary btn-sm" onClick={() => setDropOpen(!dropOpen)}>
                    👤 {user.name.split(' ')[0]}
                  </button>
                  {dropOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-name">{user.name}</div>
                        <div className="user-dropdown-email">{user.email}</div>
                        <span className={`badge badge-${user.role} user-dropdown-role-badge`}>{user.role}</span>
                      </div>
                      {user.role === 'admin' && <Link to="/admin" className="dropdown-item" onClick={close}>⚙️ Admin Dashboard</Link>}
                      <Link to="/orders" className="dropdown-item" onClick={close}>📦 My Orders</Link>
                      <Link to="/invoices" className="dropdown-item" onClick={close}>🧾 My Invoices</Link>
                      <Link to="/wishlist" className="dropdown-item" onClick={close}>🤍 Wishlist</Link>
                      <Link to="/profile" className="dropdown-item" onClick={close}>👤 Profile</Link>
                      <div className="dropdown-item dropdown-item-danger" onClick={() => { logout(); close(); navigate('/'); }}>🚪 Logout</div>
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
          <div className="mobile-right">
            <Link to="/cart" className="nav-link nav-cart-link">
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
          <span className="nav-search-icon">🔍</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <Link to="/" className="nav-link" onClick={close}>🏠 Home</Link>
        <Link to="/products" className="nav-link" onClick={close}>🛍️ Shop</Link>
        <Link to="/about" className="nav-link" onClick={close}>💫 About</Link>
        <Link to="/contact" className="nav-link" onClick={close}>📞 Contact</Link>
        <Link to="/offers" className="nav-link" onClick={close}>🔥 Special Offers</Link>
        <Link to="/quiz" className="nav-link" onClick={close}>✨ Beauty Quiz</Link>
        {user ? (
          <>
            <Link to="/wishlist" className="nav-link" onClick={close}>🤍 Wishlist</Link>
            <Link to="/orders" className="nav-link" onClick={close}>📦 My Orders</Link>
            <Link to="/support" className="nav-link" onClick={close}>🎧 Support</Link>
            <Link to="/profile" className="nav-link" onClick={close}>👤 Profile ({user.name.split(' ')[0]})</Link>
            {user.role === 'admin' && <Link to="/admin" className="nav-link" onClick={close}>⚙️ Admin Panel</Link>}
            <div className="nav-link nav-link-danger" onClick={() => { logout(); close(); navigate('/'); }}>🚪 Logout</div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={close}>🔑 Login</Link>
            <Link to="/register" className="btn btn-primary btn-mobile-cta" onClick={close}>Join Now</Link>
          </>
        )}
      </div>
    </>
  );
}
