import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
      <div className="page-hero" style={{ textAlign: 'center', padding: '68px 24px', background: 'linear-gradient(135deg,#fff0f5,#fce4ec)' }}>
        <div className="container" ref={heroRef}>
          <div style={{ fontSize: 52, marginBottom: 14, animation: 'bounceIn 0.7s ease' }}>🔒</div>
          <h1 className="section-title" style={{ fontSize: 40, color: 'var(--primary)', marginBottom: 12, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#757575', fontSize: 15, maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.8, opacity: heroVisible ? 1 : 0, transition: 'all 0.7s 0.15s ease' }}>
            Your privacy matters to us. This policy explains what data we collect, how we use it, and the rights you have over it.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 18px', borderRadius: 20, fontSize: 13, color: '#757575', boxShadow: 'var(--shadow)' }}>
            📅 Last updated: June 2026
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ background: 'white', borderBottom: '1px solid #fce4ec' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 36, padding: '18px 24px', flexWrap: 'wrap' }}>
          {[['🔒', 'SSL Encrypted'], ['🚫', 'Never Sold'], ['✅', 'GDPR Aligned'], ['🛡️', 'Secure Storage']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#555' }}>
              <span style={{ fontSize: 20 }}>{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container" style={{ paddingTop: 48, paddingBottom: 72 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36, alignItems: 'start' }}>

          {/* Sticky Nav */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contents</div>
              {sections.map(sec => (
                <button key={sec.id} onClick={() => { setActive(sec.id); document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: active === sec.id ? '#fce4ec' : 'transparent', color: active === sec.id ? 'var(--primary)' : '#555', fontWeight: active === sec.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'Poppins', transition: 'all 0.2s', marginBottom: 2 }}>
                  <span>{sec.icon}</span> {sec.title}
                </button>
              ))}
            </div>
            <div style={{ background: '#fff0f5', borderRadius: 14, padding: 18, marginTop: 16, border: '1px solid #fce4ec', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--primary)' }}>Questions?</div>
              <div style={{ fontSize: 12, color: '#757575', marginBottom: 12 }}>Our privacy team is here to help.</div>
              <Link to="/contact" className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>Contact Us</Link>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {sections.map((sec, i) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [ref, visible] = useInView();
              return (
                <div key={sec.id} id={sec.id} ref={ref}
                  style={{ background: 'white', borderRadius: 20, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: `all 0.6s ${i * 0.06}s ease` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fce4ec,#fff0f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{sec.icon}</div>
                    <h2 style={{ fontWeight: 800, fontSize: 22, color: '#212121' }}>{sec.title}</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {sec.content.map((item, j) => (
                      <div key={j} style={{ paddingLeft: 16, borderLeft: '3px solid #f48fb1' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 5, color: '#212121' }}>{item.sub}</div>
                        <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.8 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Contact CTA */}
            <div style={{ background: 'linear-gradient(135deg,#c2185b,#880e4f)', borderRadius: 20, padding: 36, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📬</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Privacy Questions?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontSize: 14, lineHeight: 1.7 }}>
                Write to us at <strong>privacy@womenhubclub.com</strong> and we will respond within 2 business days.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>Send a Message</Link>
                <Link to="/refund" className="btn btn-lg" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: 'white' }}>Refund Policy →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
