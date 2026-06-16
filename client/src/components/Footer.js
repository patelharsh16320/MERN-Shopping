import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">💗 Women HubClub</div>
          <p className="footer-about-text">
            Your one-stop destination for skincare, beauty, wellness, fashion and everything that empowers women.
          </p>
          <div className="footer-social">
            {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
              <button key={i} className="footer-social-btn">{icon}</button>
            ))}
          </div>
          <div className="footer-rating-box">
            <div className="footer-rating-title">⭐ 4.8/5 Rated Platform</div>
            <div className="footer-rating-sub">Trusted by 50,000+ members across India</div>
          </div>
        </div>

        <div>
          <h4 className="footer-col-title">Quick Links</h4>
          {[['Home', '/'], ['Shop', '/products'], ['Beauty Quiz', '/quiz'], ['Cart', '/cart'], ['Wishlist', '/wishlist'], ['My Orders', '/orders']].map(([label, path]) => (
            <Link key={path} to={path} className="footer-link">{label}</Link>
          ))}
        </div>

        <div>
          <h4 className="footer-col-title">Categories</h4>
          {['Skincare', 'Makeup & Beauty', 'Hair Care', 'Wellness', 'Accessories', 'Fashion', 'Fitness'].map(cat => (
            <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="footer-link">{cat}</Link>
          ))}
        </div>

        <div>
          <h4 className="footer-col-title">Company & Support</h4>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
          <Link to="/refund" className="footer-link">Refund & Returns</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms & Conditions</Link>
          <div className="footer-contact-block">
            <div className="footer-link">📍 123 Pink Street, Mumbai</div>
            <div className="footer-link">📞 +91 99999 99999</div>
            <div className="footer-link">✉️ hello@womenhubclub.com</div>
            <div className="footer-link">⏰ Mon-Sun: 9AM - 9PM</div>
          </div>
        </div>
      </div>

      {/* Payment strip */}
      <div className="footer-payment-strip">
        <div className="footer-payment-methods">
          {['💳 Visa', '💳 Mastercard', '📱 UPI', '📲 PhonePe', '💰 COD', '🔒 Secure'].map(m => (
            <span key={m} className="footer-payment-tag">{m}</span>
          ))}
        </div>
      </div>

      <div className="footer-bottom footer-bottom-row">
        <p className="footer-copy">© 2026 Women HubClub. All rights reserved. Made with 💗 for women, by women.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy" className="footer-bottom-link">Privacy Policy</Link>
          <span className="footer-bottom-sep">|</span>
          <Link to="/terms" className="footer-bottom-link">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
