import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import './BeautyQuiz.css';

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
    cls: 'bq-profile-dew',
    tags: ['Hydration Queen', 'Moisture Lover', 'Glow Hunter'],
  },
  {
    match: (a) => a.skinType === 'oily' && a.concern === 'acne',
    name: 'The Clear Skin Chaser',
    emoji: '✨',
    cls: 'bq-profile-clear',
    tags: ['Clarity First', 'Pore Perfectionist', 'Blemish Fighter'],
  },
  {
    match: (a) => a.lifestyle === 'active',
    name: 'The Wellness Warrior',
    emoji: '🏃‍♀️',
    cls: 'bq-profile-wellness',
    tags: ['Fitness Fanatic', 'Glow from Within', 'Active Beauty'],
  },
  {
    match: (a) => a.routine === 'dedicated' && a.budget === 'premium',
    name: 'The Radiance Ritualist',
    emoji: '👑',
    cls: 'bq-profile-radiance',
    tags: ['Luxury Lover', 'Ritual Keeper', 'Skin Perfectionist'],
  },
  {
    match: (a) => a.concern === 'brightening',
    name: 'The Glow Seeker',
    emoji: '☀️',
    cls: 'bq-profile-glow',
    tags: ['Brightening Addict', 'Sun-Kissed Goals', 'Radiance Hunter'],
  },
  {
    match: (a) => a.concern === 'antiaging',
    name: 'The Age-Defying Maven',
    emoji: '⏳',
    cls: 'bq-profile-agedefy',
    tags: ['Timeless Beauty', 'Firmness Fanatic', 'Youth Preserver'],
  },
  {
    match: (a) => a.routine === 'quick',
    name: 'The Effortless Glow',
    emoji: '⚡',
    cls: 'bq-profile-effortless',
    tags: ['Minimalist Beauty', 'Quick & Effective', 'No-Fuss Glow'],
  },
];
const DEFAULT_PROFILE = {
  name: 'The Beauty Explorer',
  emoji: '🌸',
  cls: 'bq-profile-default',
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
      className={`bq-option ${selected ? 'selected' : ''}`}
    >
      <span className="bq-option-emoji">{option.emoji}</span>
      <div>
        <div className={`bq-option-label ${selected ? 'selected' : ''}`}>{option.label}</div>
        <div className="bq-option-desc">{option.desc}</div>
      </div>
      {selected && (
        <span className="bq-option-check">✓</span>
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
      className="bq-result-card"
    >
      <div className="bq-result-img-wrap">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          alt={product.name}
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          className="bq-result-img"
        />
        <div className="bq-result-category">
          {product.category}
        </div>
      </div>
      <div className="bq-result-body">
        <div className="bq-result-name">
          {product.name}
        </div>
        <div className="bq-result-stars">
          {'⭐'.repeat(Math.round(product.rating || 4))}
          <span className="bq-result-reviews">({product.numReviews || 0})</span>
        </div>
        <div className="bq-result-price-row">
          <span className="bq-result-price">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="bq-result-orig-price">₹{product.originalPrice}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className={`bq-result-add-btn ${product.stock === 0 ? 'disabled' : ''}`}
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
      <div className="bq-loading-wrap">
        <div className="bq-loading-inner">
          <div className="bq-loading-icon">🔮</div>
          <h2 className="bq-loading-title">
            Analyzing your Beauty Profile...
          </h2>
          <p className="bq-loading-sub">Handpicking products just for you ✨</p>
          <div className="bq-loading-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className="bq-loading-dot" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && profile) {
    return (
      <div className="bq-results-wrap animate-fade">
        {/* Profile card */}
        <div className={`bq-profile-card ${profile.cls}`}>
          <div className="bq-profile-watermark">
            {profile.emoji}
          </div>
          <div className="bq-profile-emoji">
            {profile.emoji}
          </div>
          <div className="bq-profile-kicker">
            Your Beauty Profile
          </div>
          <h1 className="bq-profile-name">
            {profile.name}
          </h1>
          <div className="bq-profile-tags">
            {profile.tags.map(tag => (
              <span key={tag} className="bq-profile-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended products */}
        <div className="bq-results-heading-wrap">
          <h2 className="bq-results-heading">
            ✨ Your Recommended Products
          </h2>
          <p className="bq-results-sub">
            Handpicked based on your beauty profile
          </p>
        </div>

        {products.length > 0 ? (
          <div className="bq-results-grid">
            {products.map((p) => (
              <div key={p._id}>
                <ProductResultCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bq-no-results">
            <div className="bq-no-results-icon">🌸</div>
            <p>No products matched your profile right now. Browse all products!</p>
          </div>
        )}

        {/* Actions */}
        <div className="bq-results-actions">
          <button
            onClick={retake}
            className="bq-retake-btn"
          >
            🔄 Retake Quiz
          </button>
          <Link
            to="/products"
            className="bq-shop-link"
          >
            🛍️ Shop All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bq-quiz-wrap">
      <div className="bq-quiz-inner">

        {/* Header */}
        <div className="bq-quiz-header">
          <div className="bq-quiz-header-icon">💄</div>
          <h1 className="bq-quiz-title">
            Beauty Advisor Quiz
          </h1>
          <p className="bq-quiz-sub">
            Answer 5 quick questions — we'll build your Beauty Profile
          </p>
        </div>

        {/* Progress bar */}
        <div className="bq-progress-track">
          <div className="bq-progress-fill" style={{ '--progress': `${progress}%` }} />
        </div>
        <div className="bq-progress-meta">
          <span>Step {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>

        {/* Question card */}
        <div
          key={animKey}
          className="animate-fade bq-question-card"
        >
          <div className="bq-question-header">
            <span className="bq-question-emoji">{currentQ.emoji}</span>
            <h2 className="bq-question-text">
              {currentQ.question}
            </h2>
          </div>

          <div className="bq-options-list">
            {currentQ.options.map(opt => (
              <QuizOption
                key={opt.value}
                option={opt}
                selected={selected === opt.value}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <div className="bq-nav-row">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="bq-back-btn"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!selected}
              className={`bq-next-btn ${selected ? 'active' : ''}`}
            >
              {step === QUESTIONS.length - 1 ? '✨ See My Profile' : 'Next →'}
            </button>
          </div>
        </div>

        <div className="bq-skip-wrap">
          <Link to="/products" className="bq-skip-link">
            Skip quiz — Browse all products
          </Link>
        </div>
      </div>
    </div>
  );
}
