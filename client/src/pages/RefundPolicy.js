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
      <div className="page-hero" style={{ textAlign: 'center', padding: '68px 24px', background: 'linear-gradient(135deg,#fff0f5,#fce4ec)' }}>
        <div className="container">
          <div style={{ fontSize: 52, marginBottom: 14, animation: 'bounceIn 0.7s ease' }}>🔄</div>
          <h1 className="section-title" style={{ fontSize: 40, color: 'var(--primary)', marginBottom: 12 }}>Refund & Return Policy</h1>
          <p style={{ color: '#757575', fontSize: 15, maxWidth: 580, margin: '0 auto 20px', lineHeight: 1.8 }}>
            We want every Women HubClub order to delight you. If something goes wrong, our hassle-free return process makes it right.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['7 Days', 'Return Window'], ['Free', 'Pickup'], ['5-7 Days', 'Refund Time'], ['100%', 'Hassle-Free']].map(([value, label]) => (
              <div key={label} style={{ background: 'white', borderRadius: 14, padding: '14px 22px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>{value}</div>
                <div style={{ fontSize: 12, color: '#757575', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>How to Return</h2>
          <p className="section-subtitle text-center">4 simple steps to get your refund</p>
          <div ref={stepsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 36 }}>
            {steps.map((step, i) => (
              <div key={step.step}
                style={{ background: '#fff8fb', borderRadius: 20, padding: '28px 22px', textAlign: 'center', border: '1px solid #fce4ec', position: 'relative', opacity: stepsVisible ? 1 : 0, transform: stepsVisible ? 'none' : 'translateY(32px)', transition: `all 0.6s ${i * 0.12}s ease` }}>
                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{step.step}</div>
                <div style={{ fontSize: 44, marginTop: 12, marginBottom: 14, animation: `float ${2.5 + i * 0.4}s ease-in-out infinite` }}>{step.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: '#757575', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="section" style={{ background: '#fff8fb', borderTop: '1px solid #fce4ec' }}>
        <div className="container">
          <div ref={eligRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
            {/* Eligible */}
            <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', opacity: eligVisible ? 1 : 0, transform: eligVisible ? 'none' : 'translateX(-24px)', transition: 'all 0.7s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✅</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: '#388e3c' }}>Eligible for Return</h3>
              </div>
              {eligibility.filter(e => e.ok).map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, opacity: eligVisible ? 1 : 0, transition: `all 0.5s ${0.2 + i * 0.07}s ease` }}>
                  <span style={{ color: '#388e3c', fontWeight: 800, fontSize: 16, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{e.text}</span>
                </div>
              ))}
            </div>

            {/* Not Eligible */}
            <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', opacity: eligVisible ? 1 : 0, transform: eligVisible ? 'none' : 'translateX(24px)', transition: 'all 0.7s 0.15s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>❌</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: '#c62828' }}>Not Eligible</h3>
              </div>
              {eligibility.filter(e => !e.ok).map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, opacity: eligVisible ? 1 : 0, transition: `all 0.5s ${0.35 + i * 0.07}s ease` }}>
                  <span style={{ color: '#c62828', fontWeight: 800, fontSize: 16, flexShrink: 0, marginTop: 2 }}>✗</span>
                  <span style={{ fontSize: 14, color: '#757575', lineHeight: 1.6 }}>{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Timeline */}
      <div className="section" style={{ background: 'white' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Refund Timeline</h2>
          <p className="section-subtitle text-center">Expected time for your money back</p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { method: 'UPI / PhonePe / GPay', time: '2-3 business days', icon: '📱' },
              { method: 'Credit / Debit Card', time: '5-7 business days', icon: '💳' },
              { method: 'Net Banking', time: '5-7 business days', icon: '🏦' },
              { method: 'Wallet (Paytm etc.)', time: '1-2 business days', icon: '👛' },
              { method: 'Cash on Delivery', time: '7-10 business days (bank transfer)', icon: '💵' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff8fb', borderRadius: 14, padding: '16px 20px', border: '1px solid #fce4ec' }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.method}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="forest-section">
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Frequently Asked Questions</h2>
          <p className="section-subtitle text-center">Everything you need to know about returns</p>
          <div ref={faqRef} style={{ maxWidth: 700, margin: '32px auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', opacity: faqVisible ? 1 : 0, transform: faqVisible ? 'none' : 'translateY(16px)', transition: `all 0.5s ${i * 0.08}s ease` }}>
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ padding: '16px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 18, color: 'var(--primary)', transition: 'transform 0.25s', transform: openFaq === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 16px', color: '#757575', fontSize: 14, lineHeight: 1.8, borderTop: '1px solid #f5f5f5', paddingTop: 14 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--primary)', padding: '56px 24px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: 40, marginBottom: 12 }}>💗</div>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Still have questions?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontSize: 15 }}>Our support team is available 7 days a week, 9AM to 9PM.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>Contact Support</Link>
            <Link to="/orders" className="btn btn-lg" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: 'white' }}>My Orders →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
