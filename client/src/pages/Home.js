import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, subscriberAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/Loader';
import DailyStreak from '../components/DailyStreak';
import { toast } from 'react-toastify';
import './Home.css';

const categories = [
  { name: 'Skincare',        icon: '✨', color: '#fce4ec' },
  { name: 'Makeup & Beauty', icon: '💄', color: '#fce4ec' },
  { name: 'Hair Care',       icon: '💆', color: '#f8bbd0' },
  { name: 'Wellness',        icon: '🧘', color: '#fce4ec' },
  { name: 'Accessories',     icon: '💍', color: '#f8bbd0' },
  { name: 'Fashion',         icon: '👗', color: '#fce4ec' },
  { name: 'Fitness',         icon: '🏋️', color: '#f8bbd0' },
  { name: 'Books & Journals',icon: '📖', color: '#fce4ec' },
  { name: 'Home & Living',   icon: '🕯️', color: '#f8bbd0' },
  { name: 'Nutrition',       icon: '💊', color: '#fce4ec' },
];

const banners = [
  { title: 'Glow Up Season', subtitle: 'Premium skincare & beauty for every woman', bg: '#fff0f5', accent: '#c2185b', emoji: '✨' },
  { title: 'Wellness First', subtitle: 'Nourish your mind, body and soul', bg: '#fce4ec', accent: '#880e4f', emoji: '🧘' },
  { title: 'Style Your Story', subtitle: 'Fashion, accessories & more — curated for you', bg: '#fff8fb', accent: '#c2185b', emoji: '👗' },
];

const dealEndTime = new Date(Date.now() + 18 * 60 * 60 * 1000);

const tips = [
  { icon: '💧', title: 'Hydration is Key', body: 'Drink 8 glasses of water daily and use a hyaluronic acid serum to lock in moisture. Your skin will thank you!', tag: 'Skincare' },
  { icon: '🌙', title: 'Night Routine Magic', body: 'Apply your richest moisturiser and overnight mask before bed. Skin repairs itself best while you sleep.', tag: 'Beauty' },
  { icon: '🧘', title: 'Morning Mindfulness', body: 'Start each morning with 5 minutes of deep breathing or meditation to reduce cortisol and boost your glow.', tag: 'Wellness' },
  { icon: '🍵', title: 'Gut-Skin Connection', body: 'Green tea, collagen supplements and probiotics support a clear, radiant complexion from the inside out.', tag: 'Nutrition' },
  { icon: '☀️', title: 'SPF Every. Single. Day.', body: 'SPF 30+ is the single best anti-aging product. Rain or shine, indoors or out — never skip sunscreen.', tag: 'Skincare' },
  { icon: '💪', title: 'Move for the Glow', body: 'Even 20 minutes of brisk walking increases circulation, giving your skin that healthy flushed glow naturally.', tag: 'Fitness' },
];

const steps = [
  { icon: '🔍', title: 'Discover', desc: 'Browse 500+ curated products across 10 categories chosen by our wellness experts.', color: '#fff0f5' },
  { icon: '🛒', title: 'Add to Cart', desc: 'Choose your favourites and build your perfect self-care basket in just a few clicks.', color: '#fce4ec' },
  { icon: '💳', title: 'Secure Checkout', desc: 'Pay safely with multiple payment options. Your data is always encrypted and protected.', color: '#fff8fb' },
  { icon: '📦', title: 'Fast Delivery', desc: 'Same-day delivery in Mumbai. Pan-India delivery in 2-4 business days at your doorstep.', color: '#fce4ec' },
];

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    const diff = Math.max(0, targetDate - Date.now());
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }, [targetDate]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

function CountdownBox({ value, label }) {
  return (
    <div className="countdown-box">
      <div className="countdown-value">
        {String(value).padStart(2, '0')}
      </div>
      <div className="countdown-label">{label}</div>
    </div>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arrivalsLoading, setArrivalsLoading] = useState(true);
  const [banner, setBanner] = useState(0);
  const [email, setEmail] = useState('');
  const [tipIdx, setTipIdx] = useState(0);
  const navigate = useNavigate();
  const dragStart = useRef(null);
  const { h, m, s } = useCountdown(dealEndTime);

  const [dealRef, dealVisible] = useInView();
  const [stepsRef, stepsVisible] = useInView();
  const [tipsRef, tipsVisible] = useInView();
  const [newsRef, newsVisible] = useInView();
  const [statsRef, statsVisible] = useInView();

  const prevBanner = () => setBanner(b => (b - 1 + banners.length) % banners.length);
  const nextBanner = () => setBanner(b => (b + 1) % banners.length);
  const onDragStart = (x) => { dragStart.current = x; };
  const onDragEnd = (x) => {
    if (dragStart.current === null) return;
    const diff = dragStart.current - x;
    if (Math.abs(diff) > 50) diff > 0 ? nextBanner() : prevBanner();
    dragStart.current = null;
  };

  useEffect(() => {
    productAPI.getFeatured().then(r => { setFeatured(r.data); setLoading(false); }).catch(() => setLoading(false));
    productAPI.getAll({ sort: 'newest', limit: 8 }).then(r => { setNewArrivals(r.data.products); setArrivalsLoading(false); }).catch(() => setArrivalsLoading(false));
    const timer = setInterval(() => setBanner(b => (b + 1) % banners.length), 4000);
    const tipTimer = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 3500);
    return () => { clearInterval(timer); clearInterval(tipTimer); };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await subscriberAPI.subscribe(email);
      toast.success('🎉 Welcome to Women HubClub! Check your inbox for exclusive deals.');
    } catch {
      toast.error('Could not subscribe. Please try again.');
    }
    setEmail('');
  };

  const b = banners[banner];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className={`banner-hero home-banner-hero banner-${banner}`}
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseUp={e => onDragEnd(e.clientX)}
        onMouseLeave={() => { dragStart.current = null; }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}>
        <div className="home-banner-emoji">{b.emoji}</div>
        <h1 className="home-banner-title">
          {b.title}
        </h1>
        <p className="home-banner-subtitle">
          {b.subtitle}
        </p>
        <div className="hero-buttons">
          <Link to="/products" className="btn btn-primary btn-lg">Shop Now →</Link>
          <Link to="/about" className="btn btn-secondary btn-lg">Our Story</Link>
        </div>
        <div className="home-banner-dots-row">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBanner(i)}
              className={`home-banner-dot ${i === banner ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      {/* ── Trust Strip ── */}
      <div className="home-trust-strip">
        <div className="container home-trust-inner">
          {[['🚀', 'Free Delivery', 'On orders above ₹999'], ['💯', '100% Authentic', 'Certified products only'], ['⭐', '4.8/5 Rating', '50,000+ happy members'], ['🔄', 'Easy Returns', '7-day return policy']].map(([icon, title, sub]) => (
            <div key={title} className="home-trust-item">
              <div className="home-trust-icon">{icon}</div>
              <div className="home-trust-title">{title}</div>
              <div className="home-trust-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Login Streak (logged-in users) ── */}
      <DailyStreak />

      {/* ── Flash Deals Countdown ── */}
      <div ref={dealRef} className="home-deals-section">
        <div className="home-deals-blob-1" />
        <div className="home-deals-blob-2" />
        <div className="container home-deals-inner">
          <div className="home-deals-icon">⚡</div>
          <h2 className={`home-deals-title reveal ${dealVisible ? 'visible' : ''}`}>
            Flash Deals — Today Only!
          </h2>
          <p className={`home-deals-sub reveal delay-1 ${dealVisible ? 'visible' : ''}`}>
            Up to 40% off on selected products. Sale ends in:
          </p>
          <div className={`home-deals-countdown-row reveal delay-2 ${dealVisible ? 'visible' : ''}`}>
            <CountdownBox value={h} label="Hours" />
            <div className="home-deals-colon">:</div>
            <CountdownBox value={m} label="Mins" />
            <div className="home-deals-colon">:</div>
            <CountdownBox value={s} label="Secs" />
          </div>
          <div className={`home-deals-ctas reveal delay-3 ${dealVisible ? 'visible' : ''}`}>
            <Link to="/products?sort=featured" className="btn btn-lg home-deals-btn-white">🛍️ Shop Flash Deals</Link>
            <Link to="/products" className="btn btn-lg home-deals-btn-outline">Browse All →</Link>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="section">
        <div className="container">
          <h2 className="section-title home-accent-title">Shop by Category</h2>
          <p className="section-subtitle">Everything a modern woman needs — all in one place</p>
          <div className="home-categories-grid">
            {categories.map((cat) => (
              <div key={cat.name}
                className="home-category-card"
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}>
                <div className="home-category-icon">{cat.icon}</div>
                <div className="home-category-name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div className="section home-featured-section">
        <div className="container">
          <div className="home-section-header-row">
            <div>
              <h2 className="section-title home-accent-title">Featured Picks</h2>
              <p className="section-subtitle home-subtitle-tight">Handpicked by our beauty & wellness experts</p>
            </div>
            <Link to="/products" className="btn btn-secondary">View All →</Link>
          </div>
          <div className="products-grid">
            {loading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div ref={stepsRef} className="section home-steps-section">
        <div className="container">
          <h2 className="section-title text-center home-accent-title home-heading-tight">How It Works</h2>
          <p className="section-subtitle text-center">Shopping with us is simple, safe and delightful</p>
          <div className="home-steps-grid">
            {steps.map((step, i) => (
              <div key={step.title}
                className={`home-step-card ${stepsVisible ? 'visible' : ''}`}>
                <div className="home-step-number">{i + 1}</div>
                <div className="home-step-icon">{step.icon}</div>
                <h3 className="home-step-title">{step.title}</h3>
                <p className="home-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="home-steps-cta">
            <Link to="/products" className="btn btn-primary btn-lg">Start Shopping →</Link>
          </div>
        </div>
      </div>

      {/* ── New Arrivals ── */}
      <div className="section home-newarrivals-section">
        <div className="container">
          <div className="home-section-header-row">
            <div>
              <div className="home-just-arrived-pill">
                🆕 Just Arrived
              </div>
              <h2 className="section-title home-accent-title home-heading-tight">New Arrivals</h2>
              <p className="section-subtitle home-subtitle-tight">Fresh additions to our curated collection</p>
            </div>
            <Link to="/products?sort=newest" className="btn btn-primary">See All New →</Link>
          </div>
          <div className="products-grid">
            {arrivalsLoading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : newArrivals.map((p) => (
              <div key={p._id} className="home-arrival-card-wrap">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Beauty & Wellness Tips ── */}
      <div ref={tipsRef} className="section home-steps-section">
        <div className="container">
          <h2 className="section-title text-center home-accent-title home-heading-tight">Beauty & Wellness Tips</h2>
          <p className="section-subtitle text-center">Expert advice to elevate your everyday self-care routine</p>

          {/* Spotlight tip (auto-cycles) */}
          <div className="home-tip-spotlight">
            <div className="home-tip-spotlight-icon" key={tipIdx}>{tips[tipIdx].icon}</div>
            <div className="home-tip-spotlight-content">
              <div className="home-tip-spotlight-header">
                <h3 className="home-tip-spotlight-title">{tips[tipIdx].title}</h3>
                <span className="home-tip-spotlight-tag">{tips[tipIdx].tag}</span>
              </div>
              <p className="home-tip-spotlight-body">{tips[tipIdx].body}</p>
            </div>
            <div className="home-tip-dots">
              {tips.map((_, i) => (
                <button key={i} onClick={() => setTipIdx(i)}
                  className={`home-tip-dot ${i === tipIdx ? 'active' : ''}`} />
              ))}
            </div>
          </div>

          <div className="home-tips-grid">
            {tips.map((tip, i) => (
              <div key={i}
                className={`home-tip-card ${tipsVisible ? 'visible' : ''}`}
                onClick={() => setTipIdx(i)}>
                <div className="home-tip-card-header">
                  <span className="home-tip-card-icon">{tip.icon}</span>
                  <div>
                    <div className="home-tip-card-title">{tip.title}</div>
                    <span className="home-tip-card-tag">{tip.tag}</span>
                  </div>
                </div>
                <p className="home-tip-card-body">{tip.body.substring(0, 80)}…</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Animated Stats Banner ── */}
      <div ref={statsRef} className="home-stats-section">
        <div className="home-stats-blob-left">💗</div>
        <div className="home-stats-blob-right">✨</div>
        <div className="container">
          <div className="home-stats-grid">
            {[
              { value: '50,000+', label: 'Happy Members', icon: '💗' },
              { value: '500+', label: 'Curated Products', icon: '🛍️' },
              { value: '4.8 / 5', label: 'Average Rating', icon: '⭐' },
              { value: '3 Years', label: 'Of Excellence', icon: '🏆' },
              { value: '10+', label: 'Categories', icon: '✨' },
              { value: '24h', label: 'Customer Support', icon: '💬' },
            ].map((stat) => (
              <div key={stat.label} className={`home-stat-item ${statsVisible ? 'visible' : ''}`}>
                <div className="home-stat-icon">{stat.icon}</div>
                <div className="home-stat-value">{stat.value}</div>
                <div className="home-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Promo Banner ── */}
      <div className="home-promo-section">
        <div className="container">
          <div className="home-promo-icon">🎉</div>
          <h2 className="home-promo-title">
            Members Get Up to 30% Off!
          </h2>
          <p className="home-promo-sub">
            Join Women HubClub today and unlock exclusive member deals on every order.
          </p>
          <div className="home-promo-ctas">
            <Link to="/register" className="btn btn-lg home-promo-btn-white">Join Now — It's Free</Link>
            <Link to="/products" className="btn btn-lg home-promo-btn-outline">Browse Deals</Link>
          </div>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="section">
        <div className="container">
          <h2 className="section-title text-center home-accent-title">What Our Members Say</h2>
          <p className="section-subtitle text-center">Trusted by 50,000+ women across India</p>
          <div className="home-testimonials-grid">
            {[
              { name: 'Priya S.', city: 'Mumbai', review: 'The skincare products are absolutely amazing! Noticed a visible difference in just 2 weeks. My skin has never looked better.', rating: 5, tag: 'Skincare' },
              { name: 'Anjali M.', city: 'Delhi', review: 'Love the yoga mat and resistance bands. Great quality at an affordable price. Fast delivery too — same day in my city!', rating: 5, tag: 'Fitness' },
              { name: 'Kavya N.', city: 'Bengaluru', review: 'The lipstick set is gorgeous! All 6 shades are wearable and last all day. Will definitely reorder.', rating: 5, tag: 'Beauty' },
              { name: 'Sneha R.', city: 'Pune', review: 'Best platform for authentic wellness products. The membership discount pays for itself in a single order!', rating: 5, tag: 'Wellness' },
              { name: 'Meera T.', city: 'Hyderabad', review: 'Returns are truly hassle-free. Ordered 3 times and every order was perfect. Customer support is super responsive.', rating: 5, tag: 'Service' },
              { name: 'Riya K.', city: 'Chennai', review: 'I love that everything is cruelty-free certified. Finally a store that aligns with my values. 100% recommend!', rating: 5, tag: 'Clean Beauty' },
            ].map((t, i) => (
              <div key={i} className="card home-testimonial-card">
                <div className="home-testimonial-header">
                  <div className="home-testimonial-avatar">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="home-testimonial-name">{t.name}</div>
                    <div className="home-testimonial-city">📍 {t.city}</div>
                  </div>
                  <span className="home-testimonial-tag">{t.tag}</span>
                </div>
                <div className="home-testimonial-stars">{'⭐'.repeat(t.rating)}</div>
                <p className="home-testimonial-text">"{t.review}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {(() => {
        let recentlyViewed = [];
        try { recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]'); } catch {}
        if (recentlyViewed.length === 0) return null;
        return (
          <div className="container" style={{ marginBottom: 48 }}>
            <h2 className="section-title gradient-text" style={{ textAlign: 'center', marginBottom: 24 }}>👁️ Recently Viewed</h2>
            <div className="products-grid">
              {recentlyViewed.slice(0, 4).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
            {recentlyViewed.length > 4 && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link to="/products" className="btn btn-secondary">View All →</Link>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Newsletter ── */}
      <div ref={newsRef} className="home-newsletter-section">
        <div className="home-newsletter-blob-1" />
        <div className="home-newsletter-blob-2" />
        <div className="container home-newsletter-inner">
          <div className="home-newsletter-icon">💌</div>
          <h2 className={`home-newsletter-title reveal ${newsVisible ? 'visible' : ''}`}>
            Join Our Inner Circle
          </h2>
          <p className={`home-newsletter-sub reveal delay-1 ${newsVisible ? 'visible' : ''}`}>
            Get exclusive deals, early access to new arrivals, and personalised beauty tips delivered straight to your inbox. No spam — ever.
          </p>
          <form onSubmit={handleNewsletterSubmit} className={`newsletter-form home-newsletter-form-style reveal delay-2 ${newsVisible ? 'visible' : ''}`}>
            <input
              type="email"
              placeholder="yourname@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="home-newsletter-input"
            />
            <button type="submit" className="btn btn-primary home-newsletter-submit">
              Subscribe 💗
            </button>
          </form>
          <p className="home-newsletter-microtext">Join 50,000+ members • Unsubscribe anytime</p>

          <div className={`home-newsletter-perks reveal delay-3 ${newsVisible ? 'visible' : ''}`}>
            {[['🎁', 'Welcome Discount'], ['📰', 'Weekly Beauty Tips'], ['⚡', 'Flash Deal Alerts'], ['🆕', 'New Arrivals First']].map(([icon, label]) => (
              <div key={label} className="home-newsletter-perk">
                <span>{icon}</span> <span className="home-newsletter-perk-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
