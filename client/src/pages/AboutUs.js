import React from 'react';
import { useNavigate } from 'react-router-dom';

const team = [
  { name: 'Priya Sharma', role: 'Founder & CEO', emoji: '💗', bio: 'Women empowerment advocate with 12 years in wellness and beauty industry. Founded Women HubClub to make premium products accessible to all women.' },
  { name: 'Anjali Mehta', role: 'Head of Curation', emoji: '✨', bio: 'Certified beauty therapist and skincare expert. Personally tests every product before it makes it to our shelves.' },
  { name: 'Kavya Nair', role: 'Community Manager', emoji: '💪', bio: 'Passionate about building a safe, supportive community where women uplift each other every single day.' },
];

const values = [
  { icon: '💗', title: 'Women First', desc: 'Every product we sell is chosen with women\'s needs, safety and empowerment in mind.' },
  { icon: '✅', title: 'Authenticity', desc: 'We stock only 100% authentic, certified products from trusted brands. No compromises.' },
  { icon: '🌿', title: 'Clean Beauty', desc: 'We prioritise natural, cruelty-free and eco-conscious products across all our categories.' },
  { icon: '🤝', title: 'Community', desc: 'Women HubClub is more than a store — it\'s a growing sisterhood of 50,000+ members.' },
];

const stats = [
  { value: '50,000+', label: 'Happy Members' },
  { value: '500+', label: 'Curated Products' },
  { value: '4.8/5', label: 'Member Rating' },
  { value: '3 Years', label: 'Of Trust' },
];

export default function AboutUs() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-hero" style={{ textAlign: 'center', padding: '72px 24px' }}>
        <div className="container">
          <div style={{ fontSize: 56, marginBottom: 14, animation: 'float 3s ease-in-out infinite' }}>💗</div>
          <h1 className="section-title" style={{ fontSize: 44, color: 'var(--primary)', marginBottom: 14 }}>About Women HubClub</h1>
          <p style={{ color: '#757575', fontSize: 17, maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.8 }}>
            We're on a mission to empower every woman with access to premium beauty, wellness and lifestyle products.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>Explore Our Store</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--primary)', padding: '44px 24px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 28, textAlign: 'center' }}>
            {stats.map((s, i) => (
              <div key={i} className="animate-fade" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 6 }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="section">
        <div className="container">
          <div className="layout-two-col" style={{ gap: 56 }}>
            <div className="animate-left" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 110, animation: 'float 3s ease-in-out infinite' }}>🌸</div>
            </div>
            <div className="animate-right">
              <h2 className="section-title" style={{ color: 'var(--primary)', marginBottom: 18 }}>Our Story</h2>
              <p style={{ color: '#757575', lineHeight: 1.9, marginBottom: 16, fontSize: 15 }}>
                Women HubClub was born in 2021 from a simple frustration — finding authentic, high-quality beauty and wellness products without overpaying or being misled.
              </p>
              <p style={{ color: '#757575', lineHeight: 1.9, marginBottom: 16, fontSize: 15 }}>
                Our founder Priya spent years testing products and noticed a gap: most platforms didn't have women's trust at heart. So she built one that does.
              </p>
              <p style={{ color: '#757575', lineHeight: 1.9, fontSize: 15 }}>
                Today, Women HubClub is a thriving community of 50,000+ members who trust us for skincare, beauty, wellness, fashion and much more — all curated and certified.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="forest-section">
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Our Values</h2>
          <p className="section-subtitle text-center">The principles that drive us every day</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
            {values.map((v, i) => (
              <div key={i} className="contact-card animate-fade" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="contact-icon">{v.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: 17 }}>{v.title}</h3>
                <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="section">
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Meet the Team</h2>
          <p className="section-subtitle text-center">The women behind Women HubClub</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {team.map((m, i) => (
              <div key={i} className="card animate-zoom" style={{ padding: 32, textAlign: 'center', animationDelay: `${i * 0.12}s` }}>
                <div style={{ fontSize: 64, marginBottom: 14, animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}>{m.emoji}</div>
                <h3 style={{ fontWeight: 700, fontSize: 19, marginBottom: 3 }}>{m.name}</h3>
                <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>{m.role}</div>
                <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.7 }}>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#fff0f5', padding: '72px 24px', textAlign: 'center', borderTop: '1px solid #fce4ec' }}>
        <div className="container">
          <h2 style={{ fontSize: 34, fontWeight: 800, color: 'var(--primary)', marginBottom: 14 }}>Join the Sisterhood</h2>
          <p style={{ color: '#757575', fontSize: 17, marginBottom: 28 }}>50,000+ women already love Women HubClub. What are you waiting for?</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>Shop Now</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/contact')}>Talk to Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}
