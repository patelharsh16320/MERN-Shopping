import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './RefundPolicy.css';

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

const steps = [
  { step: '1', icon: '📱', title: 'Raise a Request', desc: 'Log in to your account, go to My Orders, and click "Return/Refund" on the eligible order within 7 days of delivery.' },
  { step: '2', icon: '📸', title: 'Share Evidence', desc: 'Upload photos of the product and packaging if it is damaged or not as described. This speeds up the process.' },
  { step: '3', icon: '🚚', title: 'Free Pickup', desc: 'Our logistics partner will schedule a free pickup from your address within 24-48 hours of approval.' },
  { step: '4', icon: '💳', title: 'Refund Processed', desc: 'Once the product is received and inspected, refund is processed to your original payment method within 5-7 business days.' },
];

const eligibility = [
  { ok: true,  text: 'Damaged or defective product received' },
  { ok: true,  text: 'Wrong product delivered (different from order)' },
  { ok: true,  text: 'Product not as described on the listing' },
  { ok: true,  text: 'Missing items from the order' },
  { ok: true,  text: 'Expired product delivered' },
  { ok: false, text: 'Change of mind after delivery' },
  { ok: false, text: 'Product opened and partially used' },
  { ok: false, text: 'Return raised after 7 days from delivery' },
  { ok: false, text: 'Products purchased on flash/clearance sale' },
  { ok: false, text: 'Digital downloads or gift cards' },
];

const faqs = [
  { q: 'How long does the refund take?', a: 'Once we receive and inspect the returned product, refunds are processed within 5-7 business days to the original payment method. UPI and wallet refunds may be faster (2-3 days).' },
  { q: 'Can I exchange instead of refund?', a: 'Yes! If you prefer an exchange over a refund, mention it in your return request and our support team will arrange a replacement shipment at no extra charge.' },
  { q: 'What if I received a partial order?', a: 'If items are missing from your order, contact us within 48 hours of delivery. We will either ship the missing items or offer a full refund for those items.' },
  { q: 'Is return pickup free?', a: 'Yes, for all approved return requests, we arrange free doorstep pickup. You do not pay any return shipping fee.' },
  { q: 'What happens to my loyalty points?', a: 'Loyalty points earned on returned orders will be deducted from your account balance at the time the refund is processed.' },
  { q: 'Can I cancel an order before delivery?', a: 'Yes, orders can be cancelled any time before they are shipped. Once shipped, the standard return process applies after delivery.' },
];

export default function RefundPolicy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [stepsRef, stepsVisible] = useInView();
  const [eligRef, eligVisible] = useInView();
  const [faqRef, faqVisible] = useInView();

  return (
    <div>
      {/* Hero */}
      <div className="page-hero rfp-hero">
        <div className="container">
          <div className="rfp-hero-icon">🔄</div>
          <h1 className="section-title rfp-hero-title">Refund & Return Policy</h1>
          <p className="rfp-hero-sub">
            We want every Women HubClub order to delight you. If something goes wrong, our hassle-free return process makes it right.
          </p>
          <div className="rfp-hero-stats">
            {[['7 Days', 'Return Window'], ['Free', 'Pickup'], ['5-7 Days', 'Refund Time'], ['100%', 'Hassle-Free']].map(([value, label]) => (
              <div key={label} className="rfp-hero-stat">
                <div className="rfp-hero-stat-value">{value}</div>
                <div className="rfp-hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section rfp-section-white">
        <div className="container">
          <h2 className="section-title text-center rfp-section-heading">How to Return</h2>
          <p className="section-subtitle text-center">4 simple steps to get your refund</p>
          <div ref={stepsRef} className="rfp-steps-grid">
            {steps.map((step) => (
              <div key={step.step}
                className={`rfp-step-card ${stepsVisible ? 'visible' : ''}`}>
                <div className="rfp-step-number">{step.step}</div>
                <div className="rfp-step-icon">{step.icon}</div>
                <h3 className="rfp-step-title">{step.title}</h3>
                <p className="rfp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="section rfp-elig-section">
        <div className="container">
          <div ref={eligRef} className="rfp-elig-grid">
            {/* Eligible */}
            <div className={`rfp-elig-card ok ${eligVisible ? 'visible' : ''}`}>
              <div className="rfp-elig-header">
                <div className="rfp-elig-icon ok">✅</div>
                <h3 className="rfp-elig-title ok">Eligible for Return</h3>
              </div>
              {eligibility.filter(e => e.ok).map((e, i) => (
                <div key={i} className="rfp-elig-item">
                  <span className="rfp-elig-mark ok">✓</span>
                  <span className="rfp-elig-text">{e.text}</span>
                </div>
              ))}
            </div>

            {/* Not Eligible */}
            <div className={`rfp-elig-card no ${eligVisible ? 'visible' : ''}`}>
              <div className="rfp-elig-header">
                <div className="rfp-elig-icon no">❌</div>
                <h3 className="rfp-elig-title no">Not Eligible</h3>
              </div>
              {eligibility.filter(e => !e.ok).map((e, i) => (
                <div key={i} className="rfp-elig-item">
                  <span className="rfp-elig-mark no">✗</span>
                  <span className="rfp-elig-text no">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Timeline */}
      <div className="section rfp-section-white">
        <div className="container rfp-timeline-container">
          <h2 className="section-title text-center rfp-section-heading">Refund Timeline</h2>
          <p className="section-subtitle text-center">Expected time for your money back</p>
          <div className="rfp-timeline-list">
            {[
              { method: 'UPI / PhonePe / GPay', time: '2-3 business days', icon: '📱' },
              { method: 'Credit / Debit Card', time: '5-7 business days', icon: '💳' },
              { method: 'Net Banking', time: '5-7 business days', icon: '🏦' },
              { method: 'Wallet (Paytm etc.)', time: '1-2 business days', icon: '👛' },
              { method: 'Cash on Delivery', time: '7-10 business days (bank transfer)', icon: '💵' },
            ].map((item, i) => (
              <div key={i} className="rfp-timeline-item">
                <span className="rfp-timeline-icon">{item.icon}</span>
                <span className="rfp-timeline-method">{item.method}</span>
                <span className="rfp-timeline-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="forest-section">
        <div className="container">
          <h2 className="section-title text-center rfp-section-heading">Frequently Asked Questions</h2>
          <p className="section-subtitle text-center">Everything you need to know about returns</p>
          <div ref={faqRef} className="rfp-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`rfp-faq-item ${faqVisible ? 'visible' : ''}`}>
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="rfp-faq-question">
                  <span>{faq.q}</span>
                  <span className={`rfp-faq-toggle ${openFaq === i ? 'open' : ''}`}>+</span>
                </div>
                {openFaq === i && (
                  <div className="rfp-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rfp-cta">
        <div className="container">
          <div className="rfp-cta-icon">💗</div>
          <h2 className="rfp-cta-title">Still have questions?</h2>
          <p className="rfp-cta-sub">Our support team is available 7 days a week, 9AM to 9PM.</p>
          <div className="rfp-cta-buttons">
            <Link to="/contact" className="btn btn-lg rfp-cta-btn-white">Contact Support</Link>
            <Link to="/orders" className="btn btn-lg rfp-cta-btn-outline">My Orders →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
