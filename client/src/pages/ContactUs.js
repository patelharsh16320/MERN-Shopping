import React, { useState } from 'react';
import { toast } from 'react-toastify';

const contactInfo = [
  { icon: '📍', title: 'Visit Us', lines: ['123 Pink Street, Bandra', 'Mumbai - 400050, India'] },
  { icon: '📞', title: 'Call Us', lines: ['+91 99999 99999', 'Mon-Sun: 9AM - 9PM'] },
  { icon: '✉️', title: 'Email Us', lines: ['hello@womenhubclub.com', 'support@womenhubclub.com'] },
  { icon: '💬', title: 'Live Chat', lines: ['Chat on our website', 'Typical reply: < 5 mins'] },
];

const faqs = [
  { q: 'Are all products on Women HubClub authentic?', a: 'Yes, every product is 100% authentic and sourced directly from brands or authorised distributors. We do not sell grey market or counterfeit goods.' },
  { q: 'How long does delivery take?', a: 'Same-day delivery in Mumbai for orders placed before 2PM. Pan-India delivery in 2-4 business days.' },
  { q: 'What is your return policy?', a: 'We offer a hassle-free 7-day return policy. If you\'re not satisfied for any reason, just raise a return request through your account.' },
  { q: 'Do you offer subscriptions or memberships?', a: 'Yes! Our Women HubClub membership gives you exclusive early access to sales, member-only discounts and free samples with every order.' },
  { q: 'Are your beauty products cruelty-free?', a: 'We actively curate cruelty-free and clean beauty options. Each product page mentions whether it\'s certified cruelty-free.' },
];

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1100));
    toast.success('Message sent! We\'ll reply within 24 hours. 💗');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div>
      <div className="page-hero" style={{ textAlign: 'center', padding: '68px 24px' }}>
        <div className="container">
          <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
          <h1 className="section-title" style={{ fontSize: 42, color: 'var(--primary)', marginBottom: 14 }}>Get In Touch</h1>
          <p style={{ color: '#757575', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            Have a question, concern or just want to say hi? We love hearing from our members!
          </p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 52 }}>
            {contactInfo.map((info, i) => (
              <div key={i} className="contact-card animate-fade" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="contact-icon">{info.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{info.title}</h3>
                {info.lines.map((line, j) => (
                  <p key={j} style={{ color: '#757575', fontSize: 13, lineHeight: 1.7 }}>{line}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="layout-two-col">
            <div className="animate-left">
              <div style={{ background: 'white', borderRadius: 14, padding: 36, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 6, color: 'var(--primary)' }}>Send a Message</h2>
                <p style={{ color: '#757575', fontSize: 13, marginBottom: 24 }}>We reply within 24 hours on business days</p>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input className="form-input" placeholder="Priya Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-select" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                      <option value="">Select a topic...</option>
                      <option>Order / Delivery Query</option>
                      <option>Product Advice</option>
                      <option>Return / Refund</option>
                      <option>Membership Query</option>
                      <option>Brand / Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-input" rows={5} placeholder="Tell us how we can help you..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                    {sending ? '⏳ Sending...' : '💗 Send Message'}
                  </button>
                </form>
              </div>
            </div>

            <div className="animate-right" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: '#fff0f5', borderRadius: 14, padding: 36, border: '1px solid #fce4ec', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 72, marginBottom: 14, animation: 'float 3s ease-in-out infinite' }}>💗</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>Women HubClub HQ</h3>
                <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.7 }}>123 Pink Street, Bandra West<br />Mumbai — 400050<br />Maharashtra, India</p>
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: 26, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 17 }}>🕐 Hours</h3>
                {[
                  ['Monday - Friday', '9:00 AM - 9:00 PM'],
                  ['Saturday', '9:00 AM - 7:00 PM'],
                  ['Sunday', '10:00 AM - 5:00 PM'],
                ].map(([day, hours]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--border)', fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{day}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="forest-section">
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Frequently Asked Questions</h2>
          <p className="section-subtitle text-center">Quick answers to common questions</p>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
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
    </div>
  );
}
