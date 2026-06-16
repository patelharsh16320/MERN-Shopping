import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './TermsConditions.css';

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
      <div className="page-hero tc-hero">
        <div className="container" ref={heroRef}>
          <div className="tc-hero-icon">📜</div>
          <h1 className={`section-title tc-hero-title reveal ${heroVisible ? 'visible' : ''}`}>
            Terms &amp; Conditions
          </h1>
          <p className={`tc-hero-sub reveal delay-1 ${heroVisible ? 'visible' : ''}`}>
            Please read these terms carefully before using Women HubClub. By accessing our platform you agree to these terms.
          </p>
          <div className="tc-updated-pill">
            📅 Last updated: June 2026
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="tc-trust-strip">
        <div className="container tc-trust-row">
          {[['⚖️', 'Fair Terms'], ['🔒', 'Secure Platform'], ['🛡️', 'Buyer Protection'], ['✅', 'Transparent Policies']].map(([icon, label]) => (
            <div key={label} className="tc-trust-item">
              <span className="tc-trust-icon">{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container tc-main">
        <div className="tc-layout">

          {/* Sticky Nav */}
          <div className="tc-sticky-nav">
            <div className="tc-nav-card">
              <div className="tc-nav-label">Contents</div>
              {sections.map(sec => (
                <button key={sec.id} onClick={() => { setActive(sec.id); document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={`tc-nav-btn ${active === sec.id ? 'active' : ''}`}>
                  <span>{sec.icon}</span> {sec.title}
                </button>
              ))}
            </div>
            <div className="tc-help-box">
              <div className="tc-help-icon">💬</div>
              <div className="tc-help-title">Have Questions?</div>
              <div className="tc-help-sub">Our team is happy to clarify anything.</div>
              <Link to="/contact" className="btn btn-primary tc-help-btn">Contact Us</Link>
            </div>
            <div className="tc-privacy-link-wrap">
              <Link to="/privacy" className="tc-privacy-link">← Privacy Policy</Link>
            </div>
          </div>

          {/* Sections */}
          <div className="tc-sections-wrap">
            {sections.map((sec) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [ref, visible] = useInView();
              return (
                <div key={sec.id} id={sec.id} ref={ref}
                  className={`tc-section reveal ${visible ? 'visible' : ''}`}>
                  <div className="tc-section-header">
                    <div className="tc-section-icon">{sec.icon}</div>
                    <h2 className="tc-section-title">{sec.title}</h2>
                  </div>
                  <div className="tc-content-list">
                    {sec.content.map((item, j) => (
                      <div key={j} className="tc-content-item">
                        <div className="tc-content-sub">{item.sub}</div>
                        <p className="tc-content-text">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* CTA */}
            <div className="tc-cta-box">
              <div className="tc-cta-icon">📬</div>
              <h3 className="tc-cta-title">Questions About These Terms?</h3>
              <p className="tc-cta-text">
                Write to us at <strong>legal@womenhubclub.com</strong> and we will respond within 2 business days.
              </p>
              <div className="tc-cta-buttons">
                <Link to="/contact" className="btn btn-lg tc-cta-btn-white">Send a Message</Link>
                <Link to="/privacy" className="btn btn-lg tc-cta-btn-outline">Privacy Policy →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
