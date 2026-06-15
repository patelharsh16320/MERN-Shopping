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
    id: 'acceptance', icon: '✅', title: 'Acceptance of Terms',
    content: [
      { sub: 'Agreement', text: 'By accessing or using the Women HubClub website, mobile site, or any related service, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.' },
      { sub: 'Age Requirement', text: 'You must be at least 18 years of age to create an account or make purchases. By using our services, you confirm that you meet this requirement.' },
      { sub: 'Changes to Terms', text: 'We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance.' },
    ]
  },
  {
    id: 'accounts', icon: '👤', title: 'Account Registration',
    content: [
      { sub: 'Account Responsibility', text: 'You are responsible for maintaining the confidentiality of your login credentials. All activities that occur under your account are your sole responsibility.' },
      { sub: 'Accurate Information', text: 'You agree to provide accurate, current, and complete information during registration and to keep it up to date. Providing false information may result in account suspension.' },
      { sub: 'Account Termination', text: 'We reserve the right to suspend or permanently delete accounts that violate these Terms, engage in fraudulent activity, or harm other users or the platform.' },
      { sub: 'Single Account', text: 'Each user may maintain only one active account. Duplicate accounts may be merged or deleted at our discretion.' },
    ]
  },
  {
    id: 'orders', icon: '🛒', title: 'Products, Orders & Pricing',
    content: [
      { sub: 'Product Accuracy', text: 'We make every effort to display product images, descriptions, and prices accurately. However, we do not warrant that all descriptions are complete, reliable, or error-free.' },
      { sub: 'Pricing', text: 'All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Prices are subject to change without notice prior to order placement.' },
      { sub: 'Order Confirmation', text: 'Placing an order constitutes an offer to purchase. An order is confirmed only when you receive an email confirmation. We reserve the right to cancel orders due to stock errors or pricing mistakes.' },
      { sub: 'Stock Availability', text: 'Product availability is not guaranteed. If an ordered item becomes unavailable after your order is placed, we will notify you and offer a full refund.' },
    ]
  },
  {
    id: 'payment', icon: '💳', title: 'Payment',
    content: [
      { sub: 'Accepted Methods', text: 'We accept major credit/debit cards, UPI, net banking, digital wallets, and Cash on Delivery (COD) for eligible pin codes.' },
      { sub: 'Payment Security', text: 'All online payments are processed through PCI-DSS compliant payment gateways. We do not store your full card details on our servers.' },
      { sub: 'Failed Payments', text: 'If a payment fails or is reversed after order placement, the order will be automatically cancelled. Refunds for failed transactions are processed within 5–7 business days.' },
      { sub: 'Coupons & Discounts', text: 'Coupon codes are single-use, non-transferable, and cannot be combined with other offers unless explicitly stated. Misuse of coupon codes may result in order cancellation.' },
    ]
  },
  {
    id: 'shipping', icon: '📦', title: 'Shipping & Delivery',
    content: [
      { sub: 'Delivery Timelines', text: 'Orders are typically processed within 1–2 business days. Pan-India delivery takes 2–4 business days; same-day delivery is available in select Mumbai pin codes.' },
      { sub: 'Delivery Address', text: 'You are responsible for providing a correct and complete delivery address. We are not liable for failed deliveries due to incorrect address information.' },
      { sub: 'Tracking', text: 'A shipping confirmation with a tracking link will be sent to your registered email address once your order is dispatched.' },
      { sub: 'Delays', text: 'Delivery timelines are estimates. Women HubClub is not liable for delays caused by logistics partners, natural disasters, or other circumstances beyond our control.' },
    ]
  },
  {
    id: 'returns', icon: '🔄', title: 'Returns & Refunds',
    content: [
      { sub: 'Return Window', text: 'Most products are eligible for return within 7 days of delivery, provided they are unused, undamaged, and in original packaging.' },
      { sub: 'Non-Returnable Items', text: 'For hygiene and safety reasons, opened skincare, cosmetics, undergarments, and personal wellness products are not eligible for return.' },
      { sub: 'Refund Processing', text: 'Approved refunds are processed to the original payment method within 5–10 business days. COD refunds are credited as store credit or via bank transfer.' },
      { sub: 'Defective Products', text: 'If you receive a defective or wrong item, contact us within 48 hours of delivery with photos. We will arrange a free replacement or full refund at no cost to you.' },
    ]
  },
  {
    id: 'ip', icon: '©️', title: 'Intellectual Property',
    content: [
      { sub: 'Ownership', text: 'All content on the Women HubClub platform — including text, images, logos, graphics, and software — is the exclusive property of Women HubClub or its licensors.' },
      { sub: 'Permitted Use', text: 'You may browse and use our platform for personal, non-commercial purposes only. You may not reproduce, distribute, modify, or create derivative works without written permission.' },
      { sub: 'User Content', text: 'By submitting reviews, photos, or other content, you grant Women HubClub a non-exclusive, royalty-free licence to use, display, and distribute that content on our platform.' },
    ]
  },
  {
    id: 'prohibited', icon: '🚫', title: 'Prohibited Activities',
    content: [
      { sub: 'Fraudulent Behaviour', text: 'You may not use our platform to conduct fraudulent transactions, create fake reviews, impersonate other users, or engage in any deceptive activity.' },
      { sub: 'Technical Interference', text: 'You may not attempt to gain unauthorised access to our systems, introduce malware, scrape data, or interfere with the platform\'s normal operation.' },
      { sub: 'Misuse of Offers', text: 'Creating multiple accounts to exploit offers, coupons, or referral rewards is strictly prohibited and will result in immediate account suspension.' },
      { sub: 'Harmful Content', text: 'You may not post, share, or transmit any content that is offensive, defamatory, illegal, or violates the privacy of any individual.' },
    ]
  },
  {
    id: 'liability', icon: '⚖️', title: 'Limitation of Liability',
    content: [
      { sub: 'As-Is Service', text: 'Women HubClub is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free service.' },
      { sub: 'Liability Cap', text: 'To the maximum extent permitted by law, Women HubClub\'s total liability for any claim arising from use of our platform shall not exceed the amount paid by you in the 90 days preceding the claim.' },
      { sub: 'Indirect Damages', text: 'We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the platform.' },
      { sub: 'Third-Party Links', text: 'Our platform may link to third-party websites. We are not responsible for the content, privacy practices, or terms of those external sites.' },
    ]
  },
  {
    id: 'governing', icon: '🏛️', title: 'Governing Law & Disputes',
    content: [
      { sub: 'Jurisdiction', text: 'These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.' },
      { sub: 'Dispute Resolution', text: 'We encourage users to contact our support team first to resolve disputes informally. Most issues can be resolved quickly without formal proceedings.' },
      { sub: 'Severability', text: 'If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.' },
    ]
  },
];

export default function TermsConditions() {
  const [active, setActive] = useState('acceptance');
  const [heroRef, heroVisible] = useInView(0.1);

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ textAlign: 'center', padding: '68px 24px', background: 'linear-gradient(135deg,#f3e5f5,#e8eaf6)' }}>
        <div className="container" ref={heroRef}>
          <div style={{ fontSize: 52, marginBottom: 14, animation: 'bounceIn 0.7s ease' }}>📜</div>
          <h1 className="section-title" style={{ fontSize: 40, color: '#7b1fa2', marginBottom: 12, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: '#757575', fontSize: 15, maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.8, opacity: heroVisible ? 1 : 0, transition: 'all 0.7s 0.15s ease' }}>
            Please read these terms carefully before using Women HubClub. By accessing our platform you agree to these terms.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 18px', borderRadius: 20, fontSize: 13, color: '#757575', boxShadow: 'var(--shadow)' }}>
            📅 Last updated: June 2026
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8eaf6' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 36, padding: '18px 24px', flexWrap: 'wrap' }}>
          {[['⚖️', 'Fair Terms'], ['🔒', 'Secure Platform'], ['🛡️', 'Buyer Protection'], ['✅', 'Transparent Policies']].map(([icon, label]) => (
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
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: active === sec.id ? '#f3e5f5' : 'transparent', color: active === sec.id ? '#7b1fa2' : '#555', fontWeight: active === sec.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'Poppins', transition: 'all 0.2s', marginBottom: 2 }}>
                  <span>{sec.icon}</span> {sec.title}
                </button>
              ))}
            </div>
            <div style={{ background: '#f3e5f5', borderRadius: 14, padding: 18, marginTop: 16, border: '1px solid #e1bee7', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#7b1fa2' }}>Have Questions?</div>
              <div style={{ fontSize: 12, color: '#757575', marginBottom: 12 }}>Our team is happy to clarify anything.</div>
              <Link to="/contact" className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>Contact Us</Link>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Link to="/privacy" style={{ fontSize: 12, color: '#9e9e9e', textDecoration: 'none' }}>← Privacy Policy</Link>
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
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f3e5f5,#e8eaf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{sec.icon}</div>
                    <h2 style={{ fontWeight: 800, fontSize: 22, color: '#212121' }}>{sec.title}</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {sec.content.map((item, j) => (
                      <div key={j} style={{ paddingLeft: 16, borderLeft: '3px solid #ce93d8' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 5, color: '#212121' }}>{item.sub}</div>
                        <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.8 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg,#7b1fa2,#4a148c)', borderRadius: 20, padding: 36, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📬</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Questions About These Terms?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontSize: 14, lineHeight: 1.7 }}>
                Write to us at <strong>legal@womenhubclub.com</strong> and we will respond within 2 business days.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-lg" style={{ background: 'white', color: '#7b1fa2', fontWeight: 700 }}>Send a Message</Link>
                <Link to="/privacy" className="btn btn-lg" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: 'white' }}>Privacy Policy →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
