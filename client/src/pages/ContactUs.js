import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { contactAPI } from '../utils/api';
import './ContactUs.css';

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
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, name: prev.name || user.name || '', email: prev.email || user.email || '' }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await contactAPI.submit(form);
      toast.success("Message sent! We'll reply within 24 hours. 💗");
      setForm({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
    setSending(false);
  };

  return (
    <div>
      <div className="page-hero cu-hero">
        <div className="container">
          <div className="cu-hero-icon">💬</div>
          <h1 className="section-title cu-hero-title">Get In Touch</h1>
          <p className="cu-hero-sub">
            Have a question, concern or just want to say hi? We love hearing from our members!
          </p>
        </div>
      </div>

      <div className="section cu-section">
        <div className="container">
          <div className="cu-info-grid">
            {contactInfo.map((info, i) => (
              <div key={i} className="contact-card animate-fade">
                <div className="contact-icon">{info.icon}</div>
                <h3 className="cu-info-title">{info.title}</h3>
                {info.lines.map((line, j) => (
                  <p key={j} className="cu-info-line">{line}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="layout-two-col">
            <div className="animate-left">
              <div className="cu-form-card">
                <h2 className="cu-form-heading">Send a Message</h2>
                <p className="cu-form-sub">We reply within 24 hours on business days</p>
                <form onSubmit={handleSubmit}>
                  <div className="cu-form-grid-2">
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
                    <textarea className="form-input cu-message-textarea" rows={5} placeholder="Tell us how we can help you..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                  </div>
                  <button className="btn btn-primary btn-lg cu-submit-btn" type="submit" disabled={sending}>
                    {sending ? '⏳ Sending...' : '💗 Send Message'}
                  </button>
                </form>
              </div>
            </div>

            <div className="animate-right cu-side-col">
              <div className="cu-hq-card">
                <div className="cu-hq-icon">💗</div>
                <h3 className="cu-hq-title">Women HubClub HQ</h3>
                <p className="cu-hq-address">123 Pink Street, Bandra West<br />Mumbai — 400050<br />Maharashtra, India</p>
              </div>

              <div className="cu-hours-card">
                <h3 className="cu-hours-heading">🕐 Hours</h3>
                {[
                  ['Monday - Friday', '9:00 AM - 9:00 PM'],
                  ['Saturday', '9:00 AM - 7:00 PM'],
                  ['Sunday', '10:00 AM - 5:00 PM'],
                ].map(([day, hours]) => (
                  <div key={day} className="cu-hours-row">
                    <span className="cu-hours-day">{day}</span>
                    <span className="cu-hours-time">{hours}</span>
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
          <h2 className="section-title text-center cu-section-heading">Frequently Asked Questions</h2>
          <p className="section-subtitle text-center">Quick answers to common questions</p>
          <div className="cu-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="cu-faq-item">
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="cu-faq-question">
                  <span>{faq.q}</span>
                  <span className={`cu-faq-toggle ${openFaq === i ? 'open' : ''}`}>+</span>
                </div>
                {openFaq === i && (
                  <div className="cu-faq-answer">
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
