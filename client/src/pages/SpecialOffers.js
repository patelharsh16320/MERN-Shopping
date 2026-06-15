import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, authAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
  if (t.expired) return <span style={{ color: '#d63031', fontWeight: 700, fontSize: 11 }}>Expired</span>;
  const unit = (v, l) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#c2185b,#e91e63)', color: 'white', fontWeight: 900, fontSize: 15, lineHeight: 1, padding: '5px 8px', borderRadius: 7, minWidth: 32 }}>{String(v).padStart(2,'0')}</div>
      <div style={{ fontSize: 9, color: '#9e9e9e', marginTop: 3, fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
    </div>
  );
  const sep = <div style={{ color: '#c2185b', fontWeight: 900, fontSize: 16, paddingBottom: 14 }}>:</div>;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
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
  const [hovered, setHovered] = useState(false);

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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: hovered ? '0 20px 48px rgba(194,24,91,0.22)' : '0 4px 18px rgba(0,0,0,0.08)',
        border: `2px solid ${hovered ? '#f06292' : '#fce4ec'}`,
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(url)}>
        <img
          src={product.images?.[0] || '/placeholder.png'}
          alt={product.name}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s ease' }}
          onError={e => { e.target.src = '/placeholder.png'; }}
        />

        {/* Discount badge */}
        {savePct > 0 && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg,#d63031,#ff7675)', color: 'white', fontWeight: 900, padding: '5px 13px', borderRadius: 20, fontSize: 13, boxShadow: '0 2px 8px rgba(214,48,49,0.4)', letterSpacing: '-0.3px' }}>
            -{savePct}% OFF
          </div>
        )}

        {/* Offer label */}
        {product.specialOffer?.label && (
          <div style={{ position: 'absolute', top: savePct > 0 ? 48 : 12, left: 12, background: 'rgba(194,24,91,0.9)', backdropFilter: 'blur(4px)', color: 'white', fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontSize: 11, letterSpacing: '0.3px' }}>
            {product.specialOffer.label}
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}
        >
          {isWished ? '❤️' : '🤍'}
        </button>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: '#d63031', color: 'white', fontWeight: 800, fontSize: 13, padding: '8px 20px', borderRadius: 20, letterSpacing: '0.5px' }}>OUT OF STOCK</span>
          </div>
        )}

        {/* Quick view hover overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(194,24,91,0.08)', opacity: hovered && !outOfStock ? 1 : 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16 }}>
          <span style={{ background: 'rgba(255,255,255,0.95)', color: '#c2185b', fontWeight: 700, fontSize: 12, padding: '7px 20px', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', letterSpacing: '0.3px' }}>
            👁 Quick View
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '16px 16px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Category */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c2185b', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
          {product.category || 'Beauty'}
        </div>

        {/* Name */}
        <div
          onClick={() => navigate(url)}
          style={{ fontWeight: 800, fontSize: 15, color: '#212121', lineHeight: 1.35, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {product.name}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(i => (
              <span key={i} style={{ fontSize: 12, color: i <= stars ? '#f39c12' : '#e0e0e0' }}>★</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>({product.numReviews || 0})</span>
        </div>

        {/* Prices */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#c2185b', lineHeight: 1 }}>₹{salePrice.toLocaleString()}</span>
          {savePct > 0 && (
            <>
              <span style={{ fontSize: 14, color: '#bdbdbd', textDecoration: 'line-through', fontWeight: 500 }}>₹{product.price.toLocaleString()}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#00b894', background: '#e8fff5', padding: '3px 8px', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                Save ₹{saveAmount.toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* Countdown */}
        {product.specialOffer?.endsAt && (
          <div style={{ background: 'linear-gradient(135deg,#fff5f7,#fce4ec)', borderRadius: 12, padding: '10px 12px', border: '1px solid #fce4ec' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9e9e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏰ Deal Ends In</div>
            <CountdownTimer endsAt={product.specialOffer.endsAt} />
          </div>
        )}

        {/* Low stock */}
        {lowStock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#d63031,#e17055)', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 11, color: '#d63031', fontWeight: 700, whiteSpace: 'nowrap' }}>Only {product.stock} left!</span>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>

        {/* Qty stepper */}
        {!outOfStock && (
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #fce4ec', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
              style={{ width: 32, height: 36, border: 'none', background: 'white', color: '#c2185b', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fce4ec'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >−</button>
            <span style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#212121' }}>{qty}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setQty(q => Math.min(product.stock, q + 1)); }}
              style={{ width: 32, height: 36, border: 'none', background: 'white', color: '#c2185b', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fce4ec'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >+</button>
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          style={{
            flex: 1,
            height: 40,
            border: 'none',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 13,
            cursor: outOfStock ? 'not-allowed' : 'pointer',
            background: outOfStock
              ? '#f5f5f5'
              : added
                ? 'linear-gradient(135deg,#00b894,#55efc4)'
                : 'linear-gradient(135deg,#c2185b,#e91e63)',
            color: outOfStock ? '#bdbdbd' : 'white',
            transition: 'all 0.25s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: outOfStock ? 'none' : added ? '0 4px 14px rgba(0,184,148,0.4)' : '0 4px 14px rgba(194,24,91,0.35)',
            letterSpacing: '0.2px',
          }}
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

  const head = { fontWeight: 800, fontSize: 11, color: '#9e9e9e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' };
  const sec  = { marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #fce4ec' };
  const chip = (active) => ({
    padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? '#fce4ec' : '#fafafa',
    border: `2px solid ${active ? '#c2185b' : '#eee'}`,
    color: active ? '#c2185b' : '#666',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '22px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #fce4ec', ...(mobile ? {} : { position: 'sticky', top: 88 }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#212121' }}>🔍 Filters</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#c2185b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Clear all</button>
      </div>

      {/* Search */}
      <div style={sec}>
        <div style={head}>Search</div>
        <input type="text" placeholder="Search deals..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ width: '100%', padding: '9px 13px', borderRadius: 10, border: '2px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff8fb' }} />
      </div>

      {/* Sort */}
      <div style={sec}>
        <div style={head}>Sort By</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SORT_OPTIONS.map(o => (
            <div key={o.value} onClick={() => setFilters(f => ({ ...f, sort: o.value }))}
              style={{ ...chip(filters.sort === o.value), display: 'block', textAlign: 'left' }}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div style={sec}>
        <div style={head}>Discount</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {DISC_OPTIONS.map(o => (
            <div key={o.value} onClick={() => setFilters(f => ({ ...f, minDiscount: o.value }))} style={chip(filters.minDiscount === o.value)}>
              {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div style={sec}>
        <div style={head}>Price Range</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" placeholder="Min ₹" value={filters.minPrice}
            onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '2px solid #fce4ec', fontSize: 13, outline: 'none', minWidth: 0, background: '#fff8fb' }} />
          <span style={{ color: '#bdbdbd', fontWeight: 700, alignSelf: 'center' }}>–</span>
          <input type="number" placeholder="Max ₹" value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '2px solid #fce4ec', fontSize: 13, outline: 'none', minWidth: 0, background: '#fff8fb' }} />
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div style={sec}>
          <div style={head}>Offer Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {labels.map(lbl => {
              const active = filters.labels.includes(lbl);
              return (
                <div key={lbl} onClick={() => setFilters(f => ({ ...f, labels: active ? f.labels.filter(l => l !== lbl) : [...f.labels, lbl] }))}
                  style={chip(active)}>
                  {lbl}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In stock */}
      <div>
        <div style={head}>Availability</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <div onClick={() => setFilters(f => ({ ...f, inStock: !f.inStock }))}
            style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', background: filters.inStock ? 'linear-gradient(135deg,#c2185b,#e91e63)' : '#e0e0e0', transition: 'background 0.25s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 2, left: filters.inStock ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s', display: 'block' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>In Stock Only</span>
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
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div ref={heroRef} style={{ background: 'linear-gradient(135deg,#880e4f,#c2185b,#e91e63,#ff6090)', padding: '64px 20px 56px', textAlign: 'center', color: 'white', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(30px)', transition: 'all 0.7s ease', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🔥</div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 900, marginBottom: 10, letterSpacing: '-1px' }}>Special Offers</h1>
          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 480, margin: '0 auto 20px' }}>Flash deals, exclusive discounts and limited-time offers just for you</p>
          {!loading && offers.length > 0 && (
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, padding: '8px 22px', borderRadius: 30, fontSize: 14 }}>
              🎁 {offers.length} active deal{offers.length!==1?'s':''} live now
            </span>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '36px 20px 60px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 22, marginTop: 8 }}>
            {[...Array(6)].map((_,i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}>
                <div style={{ height: 220, background: 'linear-gradient(90deg,#f5f5f5 25%,#eeeeee 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 12, background: '#f5f5f5', borderRadius: 6, marginBottom: 10, width: '60%' }} />
                  <div style={{ height: 16, background: '#f5f5f5', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 28, background: '#f5f5f5', borderRadius: 6, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎁</div>
            <h2 style={{ fontWeight: 800, color: '#212121', marginBottom: 10, fontSize: 28 }}>No active deals right now</h2>
            <p style={{ color: '#636e72', marginBottom: 28, fontSize: 16 }}>Check back soon — new offers drop every week!</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Shop All Products →</button>
          </div>
        ) : (
          <>
            {/* Mobile filter toggle */}
            <button onClick={() => setMobileFilterOpen(v => !v)} className="offers-filter-toggle"
              style={{ display: 'none', width: '100%', padding: '13px 20px', marginBottom: 16, borderRadius: 14, border: '2px solid #f06292', background: mobileFilterOpen?'#fce4ec':'white', color: '#c2185b', fontWeight: 800, fontSize: 14, cursor: 'pointer', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Filters{activeFilterCount>0?` (${activeFilterCount}  active)`:''}</span>
              <span>{mobileFilterOpen?'▲':'▼'}</span>
            </button>
            {mobileFilterOpen && <div className="offers-filter-mobile" style={{ marginBottom: 20 }}><FilterPanel offers={offers} filters={filters} setFilters={setFilters} onClear={clearFilters} mobile /></div>}

            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              {/* Sidebar */}
              <div className="offers-filter-sidebar" style={{ width: 260, flexShrink: 0 }}>
                <FilterPanel offers={offers} filters={filters} setFilters={setFilters} onClear={clearFilters} />
              </div>

              {/* Grid */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Result bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ background: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', color: '#c2185b', fontWeight: 800, padding: '7px 18px', borderRadius: 20, fontSize: 13, border: '1px solid #f48fb1' }}>
                    🔥 {displayed.length} deal{displayed.length!==1?'s':''} {activeFilterCount>0?'found':'available'}
                  </span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#555', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#c2185b'; e.currentTarget.style.color='#c2185b'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.color='#555'; }}>
                      ✕ Clear filters
                    </button>
                  )}
                </div>

                {displayed.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 56, marginBottom: 14 }}>😔</div>
                    <p style={{ fontWeight: 800, color: '#212121', marginBottom: 8, fontSize: 18 }}>No deals match your filters</p>
                    <p style={{ color: '#9e9e9e', marginBottom: 20, fontSize: 14 }}>Try adjusting or clearing your filters</p>
                    <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 22 }}>
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

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 768px) {
          .offers-filter-toggle { display: flex !important; }
          .offers-filter-sidebar { display: none !important; }
        }
        @media (min-width: 769px) {
          .offers-filter-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
