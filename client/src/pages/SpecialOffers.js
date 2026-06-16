import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, authAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './SpecialOffers.css';

/* ── helpers ── */
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

function CountdownTimer({ endsAt }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt) - Date.now();
      if (diff <= 0) return setT({ expired: true });
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [endsAt]);
  if (t.expired) return <span className="so-countdown-expired">Expired</span>;
  const unit = (v, l) => (
    <div className="so-countdown-unit">
      <div className="so-countdown-value">{String(v).padStart(2,'0')}</div>
      <div className="so-countdown-unit-label">{l}</div>
    </div>
  );
  const sep = <div className="so-countdown-sep">:</div>;
  return (
    <div className="so-countdown-row">
      {t.d > 0 && <>{unit(t.d,'day')}{sep}</>}
      {unit(t.h,'hr')}{sep}{unit(t.m,'min')}{sep}{unit(t.s,'sec')}
    </div>
  );
}

/* ── offer card ── */
function OfferCard({ product, wishlistIds, onWishlistToggle }) {
  const navigate        = useNavigate();
  const { addToCart }   = useCart();
  const { user }        = useAuth();
  const [qty, setQty]   = useState(1);
  const [added, setAdded] = useState(false);

  const salePrice  = product.specialOffer?.salePrice || product.price;
  const savePct    = product.price > salePrice ? Math.round((1 - salePrice / product.price) * 100) : 0;
  const saveAmount = product.price - salePrice;
  const isWished   = wishlistIds?.includes(product._id);
  const outOfStock = product.stock <= 0;
  const lowStock   = product.stock > 0 && product.stock < 10;
  const url        = product.slug ? `/products/${product.slug}` : `/products/${product._id}`;
  const stars      = Math.round(product.rating || 4);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({ ...product, price: salePrice }, qty);
    setAdded(true);
    toast.success(`🎉 ${product.name} ×${qty} added to cart!`, { autoClose: 2000 });
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.warning('Please login to use wishlist'); navigate('/login'); return; }
    try {
      const { data } = await authAPI.toggleWishlist(product._id);
      toast.success(data.added ? '❤️ Added to wishlist!' : 'Removed from wishlist', { autoClose: 1500 });
      if (onWishlistToggle) onWishlistToggle(product._id, data.added);
    } catch { toast.error('Failed to update wishlist'); }
  };

  return (
    <div className="so-card">
      {/* ── Image ── */}
      <div className="so-card-media" onClick={() => navigate(url)}>
        <img
          src={product.images?.[0] || '/placeholder.png'}
          alt={product.name}
          className="so-card-img"
          onError={e => { e.target.src = '/placeholder.png'; }}
        />

        {/* Discount badge */}
        {savePct > 0 && (
          <div className="so-discount-badge">
            -{savePct}% OFF
          </div>
        )}

        {/* Offer label */}
        {product.specialOffer?.label && (
          <div className={`so-offer-label ${savePct > 0 ? 'shifted' : ''}`}>
            {product.specialOffer.label}
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="so-wishlist-btn"
        >
          {isWished ? '❤️' : '🤍'}
        </button>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="so-oos-overlay">
            <span className="so-oos-tag">OUT OF STOCK</span>
          </div>
        )}

        {/* Quick view hover overlay */}
        <div className={`so-quickview-overlay ${!outOfStock ? 'active' : ''}`}>
          <span className="so-quickview-tag">
            👁 Quick View
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="so-card-body">

        {/* Category */}
        <div className="so-card-category">
          {product.category || 'Beauty'}
        </div>

        {/* Name */}
        <div
          onClick={() => navigate(url)}
          className="so-card-name"
        >
          {product.name}
        </div>

        {/* Rating */}
        <div className="so-rating-row">
          <div className="so-stars">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`so-star ${i <= stars ? 'filled' : ''}`}>★</span>
            ))}
          </div>
          <span className="so-review-count">({product.numReviews || 0})</span>
        </div>

        {/* Prices */}
        <div className="so-price-row">
          <span className="so-sale-price">₹{salePrice.toLocaleString()}</span>
          {savePct > 0 && (
            <>
              <span className="so-orig-price">₹{product.price.toLocaleString()}</span>
              <span className="so-save-amount">
                Save ₹{saveAmount.toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* Countdown */}
        {product.specialOffer?.endsAt && (
          <div className="so-countdown-box">
            <div className="so-countdown-label">⏰ Deal Ends In</div>
            <CountdownTimer endsAt={product.specialOffer.endsAt} />
          </div>
        )}

        {/* Low stock */}
        {lowStock && (
          <div className="so-lowstock-row">
            <div className="so-lowstock-track">
              <div className="so-lowstock-fill" style={{ '--stock-pct': `${Math.min((product.stock / 10) * 100, 100)}%` }} />
            </div>
            <span className="so-lowstock-text">Only {product.stock} left!</span>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="so-action-bar">

        {/* Qty stepper */}
        {!outOfStock && (
          <div className="so-qty-stepper">
            <button
              onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
              className="so-qty-btn"
            >−</button>
            <span className="so-qty-value">{qty}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setQty(q => Math.min(product.stock, q + 1)); }}
              className="so-qty-btn"
            >+</button>
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`so-add-btn ${outOfStock ? 'disabled' : added ? 'added' : ''}`}
        >
          {outOfStock ? 'Out of Stock' : added ? '✓ Added!' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/* ── filter panel ── */
const SORT_OPTIONS = [
  { value: 'discount_desc', label: '💰 Highest Discount' },
  { value: 'price_asc',     label: '₹ Price: Low → High' },
  { value: 'price_desc',    label: '₹ Price: High → Low' },
  { value: 'ending_soon',   label: '⏰ Ending Soon' },
];
const DISC_OPTIONS = [
  { value: 0,  label: 'All' },
  { value: 10, label: '10%+' },
  { value: 25, label: '25%+' },
  { value: 50, label: '50%+' },
  { value: 70, label: '70%+' },
];

function FilterPanel({ offers, filters, setFilters, onClear, mobile }) {
  const labels = useMemo(() => {
    const set = new Set();
    offers.forEach(p => { if (p.specialOffer?.label) set.add(p.specialOffer.label); });
    return [...set];
  }, [offers]);

  return (
    <div className={`so-filter-panel ${!mobile ? 'sticky' : ''}`}>
      <div className="so-filter-header">
        <span className="so-filter-title">🔍 Filters</span>
        <button onClick={onClear} className="so-filter-clear">Clear all</button>
      </div>

      {/* Search */}
      <div className="so-filter-section">
        <div className="so-filter-head">Search</div>
        <input type="text" placeholder="Search deals..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="so-search-input" />
      </div>

      {/* Sort */}
      <div className="so-filter-section">
        <div className="so-filter-head">Sort By</div>
        <div className="so-sort-list">
          {SORT_OPTIONS.map(o => (
            <div key={o.value} onClick={() => setFilters(f => ({ ...f, sort: o.value }))}
              className={`so-chip block ${filters.sort === o.value ? 'active' : ''}`}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div className="so-filter-section">
        <div className="so-filter-head">Discount</div>
        <div className="so-chip-row">
          {DISC_OPTIONS.map(o => (
            <div key={o.value} onClick={() => setFilters(f => ({ ...f, minDiscount: o.value }))} className={`so-chip ${filters.minDiscount === o.value ? 'active' : ''}`}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="so-filter-section">
        <div className="so-filter-head">Price Range</div>
        <div className="so-price-range-row">
          <input type="number" placeholder="Min ₹" value={filters.minPrice}
            onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
            className="so-price-input" />
          <span className="so-price-sep">–</span>
          <input type="number" placeholder="Max ₹" value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
            className="so-price-input" />
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="so-filter-section">
          <div className="so-filter-head">Offer Type</div>
          <div className="so-chip-row">
            {labels.map(lbl => {
              const active = filters.labels.includes(lbl);
              return (
                <div key={lbl} onClick={() => setFilters(f => ({ ...f, labels: active ? f.labels.filter(l => l !== lbl) : [...f.labels, lbl] }))}
                  className={`so-chip ${active ? 'active' : ''}`}>
                  {lbl}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In stock */}
      <div className="so-filter-section last">
        <div className="so-filter-head">Availability</div>
        <label className="so-avail-label">
          <div onClick={() => setFilters(f => ({ ...f, inStock: !f.inStock }))}
            className={`so-toggle-track ${filters.inStock ? 'on' : ''}`}>
            <span className="so-toggle-knob" />
          </div>
          <span className="so-avail-text">In Stock Only</span>
        </label>
      </div>
    </div>
  );
}

/* ── main ── */
const DEFAULT_FILTERS = { search: '', sort: 'discount_desc', minDiscount: 0, minPrice: '', maxPrice: '', labels: [], inStock: false };

export default function SpecialOffers() {
  const [offers, setOffers]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [wishlistIds, setWishlistIds]   = useState([]);
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const [heroRef, heroVisible]          = useInView();

  const loadOffers = useCallback(async () => {
    try {
      const { data } = await productAPI.getAll({ status: 'published', limit: 100 });
      const all = data.products || data;
      const now = new Date();
      setOffers(all.filter(p => p.specialOffer?.enabled && (!p.specialOffer.endsAt || new Date(p.specialOffer.endsAt) > now)));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    if (user?.wishlist) setWishlistIds(user.wishlist.map(id => id?.toString ? id.toString() : id));
  }, [user]);

  const getSavePct = (p) => {
    const sale = p.specialOffer?.salePrice || p.price;
    return p.price > sale ? Math.round((1 - sale / p.price) * 100) : 0;
  };

  const displayed = useMemo(() => {
    let list = [...offers];
    const q = filters.search.trim().toLowerCase();
    if (q)                   list = list.filter(p => p.name?.toLowerCase().includes(q));
    if (filters.minDiscount) list = list.filter(p => getSavePct(p) >= filters.minDiscount);
    if (filters.minPrice)    list = list.filter(p => (p.specialOffer?.salePrice || p.price) >= Number(filters.minPrice));
    if (filters.maxPrice)    list = list.filter(p => (p.specialOffer?.salePrice || p.price) <= Number(filters.maxPrice));
    if (filters.labels.length) list = list.filter(p => filters.labels.includes(p.specialOffer?.label));
    if (filters.inStock)     list = list.filter(p => p.stock > 0);
    if (filters.sort === 'price_asc')    list.sort((a,b) => (a.specialOffer?.salePrice||a.price)-(b.specialOffer?.salePrice||b.price));
    if (filters.sort === 'price_desc')   list.sort((a,b) => (b.specialOffer?.salePrice||b.price)-(a.specialOffer?.salePrice||a.price));
    if (filters.sort === 'discount_desc')list.sort((a,b) => getSavePct(b)-getSavePct(a));
    if (filters.sort === 'ending_soon')  list.sort((a,b) => {
      if (!a.specialOffer?.endsAt) return 1;
      if (!b.specialOffer?.endsAt) return -1;
      return new Date(a.specialOffer.endsAt)-new Date(b.specialOffer.endsAt);
    });
    return list;
  }, [offers, filters]);

  const activeFilterCount = (filters.search?1:0)+(filters.minDiscount>0?1:0)+(filters.minPrice?1:0)+(filters.maxPrice?1:0)+filters.labels.length+(filters.inStock?1:0);
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleWishlistToggle = (productId, added) => {
    setWishlistIds(prev => added ? [...prev, productId] : prev.filter(id => id !== productId));
  };

  return (
    <div className="so-page">
      {/* Hero */}
      <div ref={heroRef} className={`so-hero reveal ${heroVisible ? 'visible' : ''}`}>
        <div className="so-hero-blob-1" />
        <div className="so-hero-blob-2" />
        <div className="so-hero-inner">
          <div className="so-hero-icon">🔥</div>
          <h1 className="so-hero-title">Special Offers</h1>
          <p className="so-hero-sub">Flash deals, exclusive discounts and limited-time offers just for you</p>
          {!loading && offers.length > 0 && (
            <span className="so-hero-pill">
              🎁 {offers.length} active deal{offers.length!==1?'s':''} live now
            </span>
          )}
        </div>
      </div>

      <div className="container so-content">
        {loading ? (
          <div className="so-skel-grid">
            {[...Array(6)].map((_,i) => (
              <div key={i} className="so-skel-card">
                <div className="skeleton so-skel-img" />
                <div className="so-skel-body">
                  <div className="skeleton so-skel-line-1" />
                  <div className="skeleton so-skel-line-2" />
                  <div className="skeleton so-skel-line-3" />
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-icon">🎁</div>
            <h2 className="so-empty-title">No active deals right now</h2>
            <p className="so-empty-sub">Check back soon — new offers drop every week!</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Shop All Products →</button>
          </div>
        ) : (
          <>
            {/* Mobile filter toggle */}
            <button onClick={() => setMobileFilterOpen(v => !v)} className={`so-filter-toggle ${mobileFilterOpen ? 'open' : ''}`}>
              <span>🔍 Filters{activeFilterCount>0?` (${activeFilterCount}  active)`:''}</span>
              <span>{mobileFilterOpen?'▲':'▼'}</span>
            </button>
            {mobileFilterOpen && <div className="so-filter-mobile-wrap"><FilterPanel offers={offers} filters={filters} setFilters={setFilters} onClear={clearFilters} mobile /></div>}

            <div className="so-layout">
              {/* Sidebar */}
              <div className="so-filter-sidebar">
                <FilterPanel offers={offers} filters={filters} setFilters={setFilters} onClear={clearFilters} />
              </div>

              {/* Grid */}
              <div className="so-grid-col">
                {/* Result bar */}
                <div className="so-result-bar">
                  <span className="so-result-pill">
                    🔥 {displayed.length} deal{displayed.length!==1?'s':''} {activeFilterCount>0?'found':'available'}
                  </span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="so-clear-btn">
                      ✕ Clear filters
                    </button>
                  )}
                </div>

                {displayed.length === 0 ? (
                  <div className="so-no-results">
                    <div className="so-no-results-icon">😔</div>
                    <p className="so-no-results-title">No deals match your filters</p>
                    <p className="so-no-results-sub">Try adjusting or clearing your filters</p>
                    <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
                  </div>
                ) : (
                  <div className="so-offers-grid">
                    {displayed.map(product => (
                      <OfferCard
                        key={product._id}
                        product={product}
                        wishlistIds={wishlistIds}
                        onWishlistToggle={handleWishlistToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
