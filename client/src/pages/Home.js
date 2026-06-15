import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, subscriberAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/Loader';
import DailyStreak from '../components/DailyStreak';
import { toast } from 'react-toastify';

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
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ background: '#c2185b', color: 'white', borderRadius: 12, padding: '12px 18px', fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1, transition: 'all 0.3s' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 11, color: '#c2185b', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
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
      <div className="banner-hero" style={{ background: b.bg, userSelect: 'none' }}
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseUp={e => onDragEnd(e.clientX)}
        onMouseLeave={() => { dragStart.current = null; }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}>
        <div style={{ fontSize: 72, marginBottom: 14, animation: 'bounceIn 0.7s ease' }}>{b.emoji}</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, color: b.accent, marginBottom: 12, animation: 'fadeIn 0.5s ease' }}>
          {b.title}
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,20px)', color: '#757575', marginBottom: 28, animation: 'fadeIn 0.7s ease' }}>
          {b.subtitle}
        </p>
        <div className="hero-buttons">
          <Link to="/products" className="btn btn-primary btn-lg">Shop Now →</Link>
          <Link to="/about" className="btn btn-secondary btn-lg">Our Story</Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 22 }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBanner(i)}
              style={{ width: i === banner ? 22 : 7, height: 7, borderRadius: 4, border: 'none', background: i === banner ? b.accent : '#f8bbd0', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      {/* ── Trust Strip ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f5f5f5' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', padding: '18px 24px', flexWrap: 'wrap', gap: 14 }}>
          {[['🚀', 'Free Delivery', 'On orders above ₹999'], ['💯', '100% Authentic', 'Certified products only'], ['⭐', '4.8/5 Rating', '50,000+ happy members'], ['🔄', 'Easy Returns', '7-day return policy']].map(([icon, title, sub]) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#212121' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#757575' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Login Streak (logged-in users) ── */}
      <DailyStreak />

      {/* ── Flash Deals Countdown ── */}
      <div ref={dealRef} style={{ background: 'linear-gradient(135deg, #880e4f 0%, #c2185b 50%, #e91e63 100%)', padding: '52px 24px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 38, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</div>
          <h2 style={{ color: 'white', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, marginBottom: 6, opacity: dealVisible ? 1 : 0, transform: dealVisible ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease' }}>
            Flash Deals — Today Only!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: 15, opacity: dealVisible ? 1 : 0, transition: 'all 0.7s 0.15s ease' }}>
            Up to 40% off on selected products. Sale ends in:
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32, opacity: dealVisible ? 1 : 0, transition: 'all 0.7s 0.3s ease' }}>
            <CountdownBox value={h} label="Hours" />
            <div style={{ color: 'white', fontSize: 28, fontWeight: 800, paddingTop: 10, animation: 'pulse 1s ease-in-out infinite' }}>:</div>
            <CountdownBox value={m} label="Mins" />
            <div style={{ color: 'white', fontSize: 28, fontWeight: 800, paddingTop: 10, animation: 'pulse 1s ease-in-out infinite' }}>:</div>
            <CountdownBox value={s} label="Secs" />
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', opacity: dealVisible ? 1 : 0, transition: 'all 0.7s 0.5s ease' }}>
            <Link to="/products?sort=featured" className="btn btn-lg" style={{ background: 'white', color: '#c2185b', fontWeight: 700 }}>🛍️ Shop Flash Deals</Link>
            <Link to="/products" className="btn btn-lg" style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.5)' }}>Browse All →</Link>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="section">
        <div className="container">
          <h2 className="section-title" style={{ color: 'var(--primary)' }}>Shop by Category</h2>
          <p className="section-subtitle">Everything a modern woman needs — all in one place</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
            {categories.map((cat, i) => (
              <div key={cat.name}
                style={{ background: cat.color, borderRadius: 12, padding: '20px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', animation: `fadeIn ${0.25 + i * 0.07}s ease`, border: '1px solid #fce4ec' }}
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(194,24,91,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 36, marginBottom: 7 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#212121' }}>{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div className="section" style={{ background: '#fff8fb', borderTop: '1px solid #fce4ec', borderBottom: '1px solid #fce4ec' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="section-title" style={{ color: 'var(--primary)' }}>Featured Picks</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Handpicked by our beauty & wellness experts</p>
            </div>
            <Link to="/products" className="btn btn-secondary">View All →</Link>
          </div>
          <div className="products-grid">
            {loading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div ref={stepsRef} className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>How It Works</h2>
          <p className="section-subtitle text-center">Shopping with us is simple, safe and delightful</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 36, position: 'relative' }}>
            {steps.map((step, i) => (
              <div key={step.title}
                style={{ background: step.color, borderRadius: 20, padding: '32px 24px', textAlign: 'center', border: '1px solid #fce4ec', position: 'relative', opacity: stepsVisible ? 1 : 0, transform: stepsVisible ? 'none' : 'translateY(32px)', transition: `all 0.6s ${i * 0.12}s ease` }}>
                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{i + 1}</div>
                <div style={{ fontSize: 44, marginBottom: 14, marginTop: 10, animation: `float ${2.5 + i * 0.3}s ease-in-out infinite` }}>{step.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: 17, color: '#212121' }}>{step.title}</h3>
                <p style={{ color: '#757575', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/products" className="btn btn-primary btn-lg">Start Shopping →</Link>
          </div>
        </div>
      </div>

      {/* ── New Arrivals ── */}
      <div className="section" style={{ background: '#fce4ec', borderTop: '1px solid #f8bbd0', borderBottom: '1px solid #f8bbd0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, boxShadow: '0 2px 8px rgba(194,24,91,0.12)' }}>
                🆕 Just Arrived
              </div>
              <h2 className="section-title" style={{ color: 'var(--primary)', marginBottom: 6 }}>New Arrivals</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Fresh additions to our curated collection</p>
            </div>
            <Link to="/products?sort=newest" className="btn btn-primary">See All New →</Link>
          </div>
          <div className="products-grid">
            {arrivalsLoading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : newArrivals.map((p, i) => (
              <div key={p._id} style={{ animation: `fadeIn ${0.2 + i * 0.06}s ease` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Beauty & Wellness Tips ── */}
      <div ref={tipsRef} className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)', marginBottom: 6 }}>Beauty & Wellness Tips</h2>
          <p className="section-subtitle text-center">Expert advice to elevate your everyday self-care routine</p>

          {/* Spotlight tip (auto-cycles) */}
          <div style={{ background: 'linear-gradient(135deg, #fff0f5, #fce4ec)', borderRadius: 20, padding: '32px 36px', marginBottom: 28, border: '1px solid #f8bbd0', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', minHeight: 120 }}>
            <div style={{ fontSize: 56, flexShrink: 0, animation: 'bounceIn 0.5s ease' }} key={tipIdx}>{tips[tipIdx].icon}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, color: '#212121' }}>{tips[tipIdx].title}</h3>
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 600 }}>{tips[tipIdx].tag}</span>
              </div>
              <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.7 }}>{tips[tipIdx].body}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', flexShrink: 0 }}>
              {tips.map((_, i) => (
                <button key={i} onClick={() => setTipIdx(i)}
                  style={{ width: i === tipIdx ? 20 : 7, height: 7, borderRadius: 4, border: 'none', background: i === tipIdx ? 'var(--primary)' : '#f8bbd0', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {tips.map((tip, i) => (
              <div key={i}
                style={{ background: '#fff8fb', borderRadius: 16, padding: '20px 22px', border: '1px solid #fce4ec', cursor: 'pointer', transition: 'all 0.25s', opacity: tipsVisible ? 1 : 0, transform: tipsVisible ? 'none' : 'translateY(24px)', animationDelay: `${i * 0.1}s`, transitionDelay: `${i * 0.07}s` }}
                onClick={() => setTipIdx(i)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(194,24,91,0.12)'; e.currentTarget.style.borderColor = '#f48fb1'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#fce4ec'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{tip.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#212121' }}>{tip.title}</div>
                    <span style={{ background: '#fce4ec', color: 'var(--primary)', borderRadius: 20, padding: '1px 10px', fontSize: 10, fontWeight: 600 }}>{tip.tag}</span>
                  </div>
                </div>
                <p style={{ color: '#757575', fontSize: 12, lineHeight: 1.6 }}>{tip.body.substring(0, 80)}…</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Animated Stats Banner ── */}
      <div ref={statsRef} style={{ background: 'linear-gradient(135deg, #c2185b, #880e4f)', padding: '56px 24px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '5%', transform: 'translateY(-50%)', fontSize: 180, opacity: 0.05, pointerEvents: 'none' }}>💗</div>
        <div style={{ position: 'absolute', top: '50%', right: '5%', transform: 'translateY(-50%)', fontSize: 180, opacity: 0.05, pointerEvents: 'none' }}>✨</div>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 28, textAlign: 'center' }}>
            {[
              { value: '50,000+', label: 'Happy Members', icon: '💗' },
              { value: '500+', label: 'Curated Products', icon: '🛍️' },
              { value: '4.8 / 5', label: 'Average Rating', icon: '⭐' },
              { value: '3 Years', label: 'Of Excellence', icon: '🏆' },
              { value: '10+', label: 'Categories', icon: '✨' },
              { value: '24h', label: 'Customer Support', icon: '💬' },
            ].map((stat, i) => (
              <div key={stat.label} style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? 'none' : 'scale(0.7)', transition: `all 0.6s ${i * 0.1}s ease` }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 4 }}>{stat.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Promo Banner ── */}
      <div style={{ background: '#880e4f', padding: '52px 24px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
          <h2 style={{ color: 'white', fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, marginBottom: 10 }}>
            Members Get Up to 30% Off!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 22, fontSize: 15 }}>
            Join Women HubClub today and unlock exclusive member deals on every order.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>Join Now — It's Free</Link>
            <Link to="/products" className="btn btn-lg" style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.6)' }}>Browse Deals</Link>
          </div>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="section">
        <div className="container">
          <h2 className="section-title text-center" style={{ color: 'var(--primary)' }}>What Our Members Say</h2>
          <p className="section-subtitle text-center">Trusted by 50,000+ women across India</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
            {[
              { name: 'Priya S.', city: 'Mumbai', review: 'The skincare products are absolutely amazing! Noticed a visible difference in just 2 weeks. My skin has never looked better.', rating: 5, tag: 'Skincare' },
              { name: 'Anjali M.', city: 'Delhi', review: 'Love the yoga mat and resistance bands. Great quality at an affordable price. Fast delivery too — same day in my city!', rating: 5, tag: 'Fitness' },
              { name: 'Kavya N.', city: 'Bengaluru', review: 'The lipstick set is gorgeous! All 6 shades are wearable and last all day. Will definitely reorder.', rating: 5, tag: 'Beauty' },
              { name: 'Sneha R.', city: 'Pune', review: 'Best platform for authentic wellness products. The membership discount pays for itself in a single order!', rating: 5, tag: 'Wellness' },
              { name: 'Meera T.', city: 'Hyderabad', review: 'Returns are truly hassle-free. Ordered 3 times and every order was perfect. Customer support is super responsive.', rating: 5, tag: 'Service' },
              { name: 'Riya K.', city: 'Chennai', review: 'I love that everything is cruelty-free certified. Finally a store that aligns with my values. 100% recommend!', rating: 5, tag: 'Clean Beauty' },
            ].map((t, i) => (
              <div key={i} className="card"
                style={{ padding: 24, animation: `fadeIn ${0.3 + i * 0.12}s ease`, transition: 'all 0.25s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(194,24,91,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #c2185b, #f06292)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#212121', fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#9e9e9e' }}>📍 {t.city}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', background: '#fce4ec', color: 'var(--primary)', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{t.tag}</span>
                </div>
                <div style={{ color: '#f57c00', fontSize: 16, marginBottom: 8 }}>{'⭐'.repeat(t.rating)}</div>
                <p style={{ fontSize: 13, color: '#757575', lineHeight: 1.7 }}>"{t.review}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter ── */}
      <div ref={newsRef} style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 50%, #fff8fb 100%)', padding: '72px 24px', borderTop: '1px solid #fce4ec', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(194,24,91,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 320, height: 320, borderRadius: '50%', background: 'rgba(240,98,146,0.07)', pointerEvents: 'none' }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>💌</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: 'var(--primary)', marginBottom: 10, opacity: newsVisible ? 1 : 0, transform: newsVisible ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease' }}>
            Join Our Inner Circle
          </h2>
          <p style={{ color: '#757575', fontSize: 15, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.8, opacity: newsVisible ? 1 : 0, transition: 'all 0.7s 0.15s ease' }}>
            Get exclusive deals, early access to new arrivals, and personalised beauty tips delivered straight to your inbox. No spam — ever.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form"
            style={{ display: 'flex', gap: 0, maxWidth: 460, margin: '0 auto', borderRadius: 50, overflow: 'hidden', boxShadow: '0 8px 30px rgba(194,24,91,0.18)', opacity: newsVisible ? 1 : 0, transition: 'all 0.7s 0.3s ease' }}>
            <input
              type="email"
              placeholder="yourname@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ flex: 1, padding: '14px 22px', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Poppins', background: 'white', color: '#212121', minWidth: 0 }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 0, padding: '14px 24px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Subscribe 💗
            </button>
          </form>
          <p style={{ color: '#bdbdbd', fontSize: 11, marginTop: 14 }}>Join 50,000+ members • Unsubscribe anytime</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 32, flexWrap: 'wrap', opacity: newsVisible ? 1 : 0, transition: 'all 0.7s 0.5s ease' }}>
            {[['🎁', 'Welcome Discount'], ['📰', 'Weekly Beauty Tips'], ['⚡', 'Flash Deal Alerts'], ['🆕', 'New Arrivals First']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#757575', fontSize: 13 }}>
                <span>{icon}</span> <span style={{ fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
