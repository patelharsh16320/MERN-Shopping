import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

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
      <div className="page-hero au-hero">
        <div className="container">
          <div className="au-hero-icon">💗</div>
          <h1 className="section-title au-hero-title">About Women HubClub</h1>
          <p className="au-hero-sub">
            We're on a mission to empower every woman with access to premium beauty, wellness and lifestyle products.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>Explore Our Store</button>
        </div>
      </div>

      {/* Stats */}
      <div className="au-stats-section">
        <div className="container">
          <div className="au-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="animate-fade">
                <div className="au-stat-value">{s.value}</div>
                <div className="au-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="section">
        <div className="container">
          <div className="layout-two-col au-story-cols">
            <div className="animate-left au-story-img-wrap">
              <div className="au-story-emoji">🌸</div>
            </div>
            <div className="animate-right">
              <h2 className="section-title au-story-heading">Our Story</h2>
              <p className="au-story-text">
                Women HubClub was born in 2021 from a simple frustration — finding authentic, high-quality beauty and wellness products without overpaying or being misled.
              </p>
              <p className="au-story-text">
                Our founder Priya spent years testing products and noticed a gap: most platforms didn't have women's trust at heart. So she built one that does.
              </p>
              <p className="au-story-text last">
                Today, Women HubClub is a thriving community of 50,000+ members who trust us for skincare, beauty, wellness, fashion and much more — all curated and certified.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="forest-section">
        <div className="container">
          <h2 className="section-title text-center au-section-heading">Our Values</h2>
          <p className="section-subtitle text-center">The principles that drive us every day</p>
          <div className="au-values-grid">
            {values.map((v, i) => (
              <div key={i} className="contact-card animate-fade">
                <div className="contact-icon">{v.icon}</div>
                <h3 className="au-value-title">{v.title}</h3>
                <p className="au-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="section">
        <div className="container">
          <h2 className="section-title text-center au-section-heading">Meet the Team</h2>
          <p className="section-subtitle text-center">The women behind Women HubClub</p>
          <div className="au-team-grid">
            {team.map((m, i) => (
              <div key={i} className="card animate-zoom au-team-card">
                <div className="au-team-emoji">{m.emoji}</div>
                <h3 className="au-team-name">{m.name}</h3>
                <div className="au-team-role">{m.role}</div>
                <p className="au-team-bio">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="au-cta-section">
        <div className="container">
          <h2 className="au-cta-heading">Join the Sisterhood</h2>
          <p className="au-cta-sub">50,000+ women already love Women HubClub. What are you waiting for?</p>
          <div className="au-cta-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>Shop Now</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/contact')}>Talk to Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}
