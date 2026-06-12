import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">💗 Women HubClub</div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: 16 }}>
            Your one-stop destination for skincare, beauty, wellness, fashion and everything that empowers women.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
            {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
              <button key={i} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', width: '38px', height: '38px', cursor: 'pointer', fontSize: '17px', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.background = 'rgba(194,24,91,0.4)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}>{icon}</button>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>⭐ 4.8/5 Rated Platform</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Trusted by 50,000+ members across India</div>
          </div>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>Quick Links</h4>
          {[['Home', '/'], ['Shop', '/products'], ['Beauty Quiz', '/quiz'], ['Cart', '/cart'], ['Wishlist', '/wishlist'], ['My Orders', '/orders']].map(([label, path]) => (
            <Link key={path} to={path} className="footer-link">{label}</Link>
          ))}
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>Categories</h4>
          {['Skincare', 'Makeup & Beauty', 'Hair Care', 'Wellness', 'Accessories', 'Fashion', 'Fitness'].map(cat => (
            <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="footer-link">{cat}</Link>
          ))}
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>Company & Support</h4>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
          <Link to="/refund" className="footer-link">Refund & Returns</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <div style={{ marginTop: 16 }}>
            <div className="footer-link">📍 123 Pink Street, Mumbai</div>
            <div className="footer-link">📞 +91 99999 99999</div>
            <div className="footer-link">✉️ hello@womenhubclub.com</div>
            <div className="footer-link">⏰ Mon-Sun: 9AM - 9PM</div>
          </div>
        </div>
      </div>

      {/* Payment strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {['💳 Visa', '💳 Mastercard', '📱 UPI', '📲 PhonePe', '💰 COD', '🔒 Secure'].map(m => (
            <span key={m} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{m}</span>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Women HubClub. All rights reserved. Made with 💗 for women, by women.</p>
      </div>
    </footer>
  );
}
