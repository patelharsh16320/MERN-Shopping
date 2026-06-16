import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const sections = [
  {
    id: 'collection', icon: '📋', title: 'Information We Collect',
    content: [
      { sub: 'Account Information', text: 'When you register, we collect your name, email address, phone number, and a securely hashed password. We never store passwords in plain text.' },
      { sub: 'Order & Payment Data', text: 'We store order history, delivery addresses, and saved payment method metadata (card last 4 digits and type only — full card numbers are never stored on our servers).' },
      { sub: 'Usage Data', text: 'We automatically collect page visit data, device type, and approximate location (city-level) to improve our platform. This data is anonymised and aggregated.' },
      { sub: 'Communications', text: 'If you contact us via email or the contact form, we retain that conversation to provide better support.' },
    ]
  },
  {
    id: 'use', icon: '🎯', title: 'How We Use Your Information',
    content: [
      { sub: 'Order Fulfilment', text: 'To process and deliver your orders, send order confirmations and shipping updates, and generate invoices.' },
      { sub: 'Account Management', text: 'To maintain your account, wishlist, saved addresses, and order history securely.' },
      { sub: 'Personalisation', text: 'To recommend products you might love based on your browsing and purchase history.' },
      { sub: 'Service Improvement', text: 'To understand how our platform is used so we can fix bugs, improve performance, and build features our members need.' },
    ]
  },
  {
    id: 'sharing', icon: '🤝', title: 'Data Sharing & Third Parties',
    content: [
      { sub: 'We Never Sell Your Data', text: 'Women HubClub will never sell, rent, or trade your personal information to any third party for their own marketing purposes.' },
      { sub: 'Delivery Partners', text: 'We share your name and delivery address with our logistics partners solely to fulfil your orders.' },
      { sub: 'Payment Processors', text: 'Payments are processed by PCI-DSS compliant payment gateways. We do not have access to your full card details.' },
      { sub: 'Legal Obligations', text: 'We may disclose information if required by law, court order, or to protect the rights and safety of our members.' },
    ]
  },
  {
    id: 'security', icon: '🔒', title: 'Data Security',
    content: [
      { sub: 'Encryption', text: 'All data transmitted between your browser and our servers is encrypted using HTTPS/TLS. Passwords are hashed using bcrypt with a cost factor of 12.' },
      { sub: 'JWT Tokens', text: 'Authentication uses 30-day JSON Web Tokens stored client-side. Tokens are invalidated on logout and when your account status changes.' },
      { sub: 'Access Control', text: 'Production data is accessible only to authorised personnel. Admin actions are logged and auditable.' },
      { sub: 'Breach Response', text: 'In the event of a data breach, we will notify affected users within 72 hours and take immediate remediation steps.' },
    ]
  },
  {
    id: 'rights', icon: '⚖️', title: 'Your Rights',
    content: [
      { sub: 'Access', text: 'You can view all personal data we hold by visiting your Profile page or by emailing privacy@womenhubclub.com.' },
      { sub: 'Correction', text: 'You can update your name, phone, and address at any time from your Profile. Email cannot be changed for security reasons.' },
      { sub: 'Deletion', text: 'You may request account deletion by contacting our support team. We will delete your data within 30 days, except where we are legally required to retain it.' },
      { sub: 'Data Portability', text: 'You can request a machine-readable export of all data associated with your account at any time.' },
    ]
  },
  {
    id: 'cookies', icon: '🍪', title: 'Cookies & Local Storage',
    content: [
      { sub: 'Session Storage', text: 'We use browser localStorage to store your authentication token and cart contents. This data stays on your device and is cleared when you log out.' },
      { sub: 'Analytics', text: 'We use anonymous first-party visit tracking to understand traffic patterns. We do not use third-party advertising cookies.' },
      { sub: 'Preferences', text: 'No tracking cookies for advertising, remarketing, or third-party analytics are used on Women HubClub.' },
    ]
  },
];

export default function PrivacyPolicy() {
  const [active, setActive] = useState('collection');
  const [heroRef, heroVisible] = useInView(0.1);

  return (
    <div>
      {/* Hero */}
      <div className="page-hero pp-hero">
        <div className="container" ref={heroRef}>
          <div className="pp-hero-icon">🔒</div>
          <h1 className={`section-title pp-hero-title reveal ${heroVisible ? 'visible' : ''}`}>
            Privacy Policy
          </h1>
          <p className={`pp-hero-sub reveal delay-1 ${heroVisible ? 'visible' : ''}`}>
            Your privacy matters to us. This policy explains what data we collect, how we use it, and the rights you have over it.
          </p>
          <div className="pp-updated-pill">
            📅 Last updated: June 2026
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="pp-trust-strip">
        <div className="container pp-trust-row">
          {[['🔒', 'SSL Encrypted'], ['🚫', 'Never Sold'], ['✅', 'GDPR Aligned'], ['🛡️', 'Secure Storage']].map(([icon, label]) => (
            <div key={label} className="pp-trust-item">
              <span className="pp-trust-icon">{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container pp-main">
        <div className="pp-layout">

          {/* Sticky Nav */}
          <div className="pp-sticky-nav">
            <div className="pp-nav-card">
              <div className="pp-nav-label">Contents</div>
              {sections.map(sec => (
                <button key={sec.id} onClick={() => { setActive(sec.id); document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={`pp-nav-btn ${active === sec.id ? 'active' : ''}`}>
                  <span>{sec.icon}</span> {sec.title}
                </button>
              ))}
            </div>
            <div className="pp-help-box">
              <div className="pp-help-icon">💬</div>
              <div className="pp-help-title">Questions?</div>
              <div className="pp-help-sub">Our privacy team is here to help.</div>
              <Link to="/contact" className="btn btn-primary pp-help-btn">Contact Us</Link>
            </div>
          </div>

          {/* Sections */}
          <div className="pp-sections-wrap">
            {sections.map((sec) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [ref, visible] = useInView();
              return (
                <div key={sec.id} id={sec.id} ref={ref}
                  className={`pp-section reveal ${visible ? 'visible' : ''}`}>
                  <div className="pp-section-header">
                    <div className="pp-section-icon">{sec.icon}</div>
                    <h2 className="pp-section-title">{sec.title}</h2>
                  </div>
                  <div className="pp-content-list">
                    {sec.content.map((item, j) => (
                      <div key={j} className="pp-content-item">
                        <div className="pp-content-sub">{item.sub}</div>
                        <p className="pp-content-text">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Contact CTA */}
            <div className="pp-cta-box">
              <div className="pp-cta-icon">📬</div>
              <h3 className="pp-cta-title">Privacy Questions?</h3>
              <p className="pp-cta-text">
                Write to us at <strong>privacy@womenhubclub.com</strong> and we will respond within 2 business days.
              </p>
              <div className="pp-cta-buttons">
                <Link to="/contact" className="btn btn-lg pp-cta-btn-white">Send a Message</Link>
                <Link to="/refund" className="btn btn-lg pp-cta-btn-outline">Refund Policy →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
