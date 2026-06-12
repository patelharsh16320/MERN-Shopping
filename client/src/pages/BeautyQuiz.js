import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const QUESTIONS = [
  {
    key: 'skinType',
    emoji: '💧',
    question: "What's your skin type?",
    options: [
      { value: 'dry', label: 'Dry', emoji: '🏜️', desc: 'Feels tight or flaky' },
      { value: 'oily', label: 'Oily', emoji: '✨', desc: 'Shiny with enlarged pores' },
      { value: 'combination', label: 'Combination', emoji: '⚖️', desc: 'Oily T-zone, dry cheeks' },
      { value: 'sensitive', label: 'Sensitive', emoji: '🌸', desc: 'Reacts easily, prone to redness' },
    ],
  },
  {
    key: 'concern',
    emoji: '🎯',
    question: "What's your main skin concern?",
    options: [
      { value: 'hydration', label: 'Hydration', emoji: '💦', desc: 'Plump & deeply moisturized' },
      { value: 'brightening', label: 'Brightening', emoji: '☀️', desc: 'Glow & even skin tone' },
      { value: 'antiaging', label: 'Anti-Aging', emoji: '⏳', desc: 'Firm, smooth & youthful' },
      { value: 'acne', label: 'Acne Control', emoji: '🎯', desc: 'Clear & blemish-free skin' },
    ],
  },
  {
    key: 'routine',
    emoji: '⏰',
    question: 'How much time do you give your beauty routine?',
    options: [
      { value: 'quick', label: 'Quick', emoji: '⚡', desc: '5 min — essentials only' },
      { value: 'balanced', label: 'Balanced', emoji: '🌿', desc: '15 min — a little of everything' },
      { value: 'dedicated', label: 'Dedicated', emoji: '💆', desc: '30+ min — full ritual' },
    ],
  },
  {
    key: 'lifestyle',
    emoji: '🌍',
    question: 'Which best describes your lifestyle?',
    options: [
      { value: 'active', label: 'Active & Sporty', emoji: '🏃‍♀️', desc: 'Fitness & always on the go' },
      { value: 'office', label: 'Office Life', emoji: '💼', desc: 'Desk job, polished look' },
      { value: 'outdoor', label: 'Outdoor Adventurer', emoji: '🌿', desc: 'Sun, fresh air & nature' },
      { value: 'homebody', label: 'Homebody', emoji: '🏠', desc: 'Cozy self-care days' },
    ],
  },
  {
    key: 'budget',
    emoji: '💰',
    question: "What's your beauty budget per product?",
    options: [
      { value: 'low', label: 'Budget-Friendly', emoji: '🛍️', desc: 'Under ₹500' },
      { value: 'mid', label: 'Mid-Range', emoji: '💎', desc: '₹500 – ₹2,000' },
      { value: 'premium', label: 'Premium', emoji: '👑', desc: '₹2,000 and above' },
    ],
  },
];

const PROFILES = [
  {
    match: (a) => a.skinType === 'dry' && a.concern === 'hydration',
    name: 'The Dew Drop Devotee',
    emoji: '💧',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    tags: ['Hydration Queen', 'Moisture Lover', 'Glow Hunter'],
  },
  {
    match: (a) => a.skinType === 'oily' && a.concern === 'acne',
    name: 'The Clear Skin Chaser',
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    tags: ['Clarity First', 'Pore Perfectionist', 'Blemish Fighter'],
  },
  {
    match: (a) => a.lifestyle === 'active',
    name: 'The Wellness Warrior',
    emoji: '🏃‍♀️',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    tags: ['Fitness Fanatic', 'Glow from Within', 'Active Beauty'],
  },
  {
    match: (a) => a.routine === 'dedicated' && a.budget === 'premium',
    name: 'The Radiance Ritualist',
    emoji: '👑',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    tags: ['Luxury Lover', 'Ritual Keeper', 'Skin Perfectionist'],
  },
  {
    match: (a) => a.concern === 'brightening',
    name: 'The Glow Seeker',
    emoji: '☀️',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    tags: ['Brightening Addict', 'Sun-Kissed Goals', 'Radiance Hunter'],
  },
  {
    match: (a) => a.concern === 'antiaging',
    name: 'The Age-Defying Maven',
    emoji: '⏳',
    gradient: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)',
    tags: ['Timeless Beauty', 'Firmness Fanatic', 'Youth Preserver'],
  },
  {
    match: (a) => a.routine === 'quick',
    name: 'The Effortless Glow',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
    tags: ['Minimalist Beauty', 'Quick & Effective', 'No-Fuss Glow'],
  },
];
const DEFAULT_PROFILE = {
  name: 'The Beauty Explorer',
  emoji: '🌸',
  gradient: 'linear-gradient(135deg, #c2185b 0%, #f06292 100%)',
  tags: ['Versatile Beauty', 'Open to Everything', 'All-Around Glam'],
};

function getProfile(answers) {
  return PROFILES.find((p) => p.match(answers)) || DEFAULT_PROFILE;
}

function getFilters(answers) {
  const concernSearchMap = {
    hydration: 'hydrat',
    brightening: 'bright',
    antiaging: 'anti',
    acne: 'acne',
  };
  const lifestyleCategoryMap = {
    active: 'Wellness',
    office: 'Makeup',
    outdoor: 'Skincare',
    homebody: 'Skincare',
  };

  const params = { limit: 6, sort: 'rating' };
  params.category = lifestyleCategoryMap[answers.lifestyle] || 'Skincare';
  if (concernSearchMap[answers.concern]) params.search = concernSearchMap[answers.concern];
  if (answers.budget === 'low') params.maxPrice = 500;
  else if (answers.budget === 'mid') { params.minPrice = 100; params.maxPrice = 2000; }
  else if (answers.budget === 'premium') params.minPrice = 500;

  return params;
}

function QuizOption({ option, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(option.value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 16,
        border: selected ? '2px solid #c2185b' : '2px solid #f0f0f0',
        background: selected ? '#fff0f5' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? '0 4px 16px rgba(194,24,91,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0 }}>{option.emoji}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: selected ? '#c2185b' : '#212121' }}>{option.label}</div>
        <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 2 }}>{option.desc}</div>
      </div>
      {selected && (
        <span style={{ marginLeft: 'auto', color: '#c2185b', fontSize: 20, flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}

function ProductResultCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const url = product.slug ? `/products/${product.slug}` : `/products/${product._id}`;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`🌿 ${product.name} added to cart!`, { autoClose: 2000 });
  };

  return (
    <div
      onClick={() => navigate(url)}
      style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #fce4ec',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(194,24,91,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
    >
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          alt={product.name}
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, background: '#fff0f5', color: '#c2185b', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
          {product.category}
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#212121', marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 12, color: '#f39c12', marginBottom: 8 }}>
          {'⭐'.repeat(Math.round(product.rating || 4))}
          <span style={{ color: '#9e9e9e', marginLeft: 4 }}>({product.numReviews || 0})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#c2185b' }}>₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span style={{ fontSize: 12, color: '#9e9e9e', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          style={{
            width: '100%',
            padding: '9px 0',
            background: product.stock === 0 ? '#e0e0e0' : 'linear-gradient(135deg, #c2185b, #e91e63)',
            color: product.stock === 0 ? '#9e9e9e' : 'white',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (product.stock > 0) e.target.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.target.style.opacity = '1'; }}
        >
          {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function BeautyQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'loading' | 'results'
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const currentQ = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  const handleSelect = (value) => setSelected(value);

  const handleNext = () => {
    const newAnswers = { ...answers, [currentQ.key]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
      setAnimKey(k => k + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep(s => s - 1);
    setSelected(answers[QUESTIONS[step - 1].key] || null);
    setAnimKey(k => k + 1);
  };

  const finishQuiz = async (finalAnswers) => {
    setPhase('loading');
    const computedProfile = getProfile(finalAnswers);
    setProfile(computedProfile);
    const filters = getFilters(finalAnswers);

    try {
      const { data } = await productAPI.getAll(filters);
      let results = data.products || [];
      if (results.length < 3) {
        const fallback = await productAPI.getAll({ limit: 6, sort: 'rating' });
        results = fallback.data.products || [];
      }
      setProducts(results.slice(0, 6));
    } catch {
      setProducts([]);
    }

    setTimeout(() => setPhase('results'), 1800);
  };

  const retake = () => {
    setStep(0);
    setAnswers({});
    setSelected(null);
    setPhase('quiz');
    setProfile(null);
    setProducts([]);
    setAnimKey(k => k + 1);
  };

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 24, animation: 'float 2s ease-in-out infinite' }}>🔮</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #c2185b, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            Analyzing your Beauty Profile...
          </h2>
          <p style={{ color: '#9e9e9e', fontSize: 15 }}>Handpicking products just for you ✨</p>
          <div style={{ marginTop: 32, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%', background: '#c2185b',
                animation: 'pulse 1s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && profile) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }} className="animate-fade">
        {/* Profile card */}
        <div style={{
          borderRadius: 28,
          background: profile.gradient,
          padding: '40px 36px',
          textAlign: 'center',
          marginBottom: 48,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, fontSize: 120, opacity: 0.08 }}>
            {profile.emoji}
          </div>
          <div style={{ fontSize: 64, marginBottom: 12, animation: 'bounceIn 0.6s ease-out' }}>
            {profile.emoji}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
            Your Beauty Profile
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 20, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {profile.name}
          </h1>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {profile.tags.map(tag => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended products */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#212121', marginBottom: 8 }}>
            ✨ Your Recommended Products
          </h2>
          <p style={{ color: '#9e9e9e', fontSize: 15 }}>
            Handpicked based on your beauty profile
          </p>
        </div>

        {products.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
            marginBottom: 48,
          }}>
            {products.map((p, i) => (
              <div key={p._id} style={{ animation: `fadeIn 0.4s ease-out ${i * 0.08}s both` }}>
                <ProductResultCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9e9e9e' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
            <p>No products matched your profile right now. Browse all products!</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={retake}
            style={{
              padding: '14px 32px', borderRadius: 50, border: '2px solid #c2185b', background: 'transparent',
              color: '#c2185b', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = '#fff0f5'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; }}
          >
            🔄 Retake Quiz
          </button>
          <Link
            to="/products"
            style={{
              padding: '14px 32px', borderRadius: 50, background: 'linear-gradient(135deg, #c2185b, #e91e63)',
              color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block',
              boxShadow: '0 4px 16px rgba(194,24,91,0.3)', transition: 'opacity 0.2s',
            }}
          >
            🛍️ Shop All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 10, animation: 'float 3s ease-in-out infinite' }}>💄</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #c2185b, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            Beauty Advisor Quiz
          </h1>
          <p style={{ color: '#9e9e9e', fontSize: 14 }}>
            Answer 5 quick questions — we'll build your Beauty Profile
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#f5f5f5', borderRadius: 50, height: 6, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 50,
            background: 'linear-gradient(90deg, #c2185b, #f06292)',
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#bdbdbd', marginBottom: 28 }}>
          <span>Step {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>

        {/* Question card */}
        <div
          key={animKey}
          className="animate-fade"
          style={{
            background: 'white',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            border: '1px solid #fce4ec',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: 40 }}>{currentQ.emoji}</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#212121', marginTop: 10 }}>
              {currentQ.question}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ.options.map(opt => (
              <QuizOption
                key={opt.value}
                option={opt}
                selected={selected === opt.value}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 50, border: '2px solid #e0e0e0',
                  background: 'transparent', color: '#757575', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#c2185b'; e.target.style.color = '#c2185b'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.color = '#757575'; }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!selected}
              style={{
                flex: 2, padding: '13px 0', borderRadius: 50, border: 'none',
                background: selected ? 'linear-gradient(135deg, #c2185b, #e91e63)' : '#e0e0e0',
                color: selected ? 'white' : '#9e9e9e',
                fontWeight: 700, fontSize: 14, cursor: selected ? 'pointer' : 'not-allowed',
                boxShadow: selected ? '0 4px 16px rgba(194,24,91,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {step === QUESTIONS.length - 1 ? '✨ See My Profile' : 'Next →'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/products" style={{ fontSize: 13, color: '#bdbdbd', textDecoration: 'none' }}>
            Skip quiz — Browse all products
          </Link>
        </div>
      </div>
    </div>
  );
}
