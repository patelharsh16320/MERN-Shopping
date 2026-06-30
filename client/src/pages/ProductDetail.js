import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, authAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const RECENTLY_VIEWED_KEY = 'recently_viewed';
const MAX_RECENTLY_VIEWED = 8;

function trackRecentlyViewed(product) {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const filtered = stored.filter(p => p._id !== product._id);
    const updated = [{ _id: product._id, name: product.name, price: product.price, images: product.images, category: product.category, rating: product.rating, numReviews: product.numReviews, slug: product.slug, stock: product.stock, discount: product.discount, originalPrice: product.originalPrice, isFeatured: product.isFeatured }, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [related, setRelated] = useState([]);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  useEffect(() => {
    productAPI.getById(id)
      .then(r => {
        setProduct(r.data);
        setLoading(false);
        trackRecentlyViewed(r.data);
        if (user) {
          setWaitlistEmail(user.email || '');
          // pre-fill review form if user already reviewed
          const existing = r.data.reviews?.find(rev => (rev.user?._id || rev.user)?.toString() === user._id?.toString());
          if (existing) { setRating(existing.rating); setComment(existing.comment); }
          authAPI.getProfile().then(p => {
            const ids = (p.data.wishlist || []).map(w => w._id || w);
            setWishlisted(ids.includes(r.data._id));
          }).catch(() => {});
        }
      })
      .then(async res => {
        if (res?.data?.category) {
          const rel = await productAPI.getAll({ category: res.data.category, limit: 4 }).catch(() => ({ data: { products: [] } }));
          setRelated((rel.data.products || []).filter(p => p._id !== res.data._id).slice(0, 4));
        }
      })
      .catch(() => { toast.error('Product not found'); navigate('/products'); });
  }, [id, navigate, user]);

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success(`🌿 ${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  const handleWaitlist = async (join) => {
    if (!waitlistEmail) return toast.warning('Enter your email');
    setWaitlistLoading(true);
    try {
      if (join) {
        await productAPI.joinWaitlist(product._id, waitlistEmail);
        setOnWaitlist(true);
        toast.success('🔔 We\'ll notify you when it\'s back in stock!');
      } else {
        await productAPI.leaveWaitlist(product._id, waitlistEmail);
        setOnWaitlist(false);
        toast.info('Removed from waitlist');
      }
    } catch { toast.error('Failed. Try again.'); }
    setWaitlistLoading(false);
  };

  const handleWishlist = async () => {
    if (!user) { toast.warning('Please login to use wishlist'); navigate('/login'); return; }
    setWishlistLoading(true);
    try {
      const { data } = await authAPI.toggleWishlist(product._id);
      setWishlisted(data.added);
      toast.success(data.added ? '❤️ Added to wishlist!' : '💔 Removed from wishlist', { autoClose: 1500 });
    } catch { toast.error('Failed'); }
    setWishlistLoading(false);
  };

  const myReview = product?.reviews?.find(rev => (rev.user?._id || rev.user)?.toString() === user?._id?.toString());

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.warning('Please login to review'); return; }
    setSubmitting(true);
    try {
      if (myReview) {
        await productAPI.updateReview(product._id, { rating, comment });
        toast.success('Review updated!');
      } else {
        await productAPI.addReview(product._id, { rating, comment });
        toast.success('Review submitted!');
      }
      setEditingReview(false);
      const r = await productAPI.getById(id);
      setProduct(r.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    setSubmitting(false);
  };

  if (loading) return <Loader />;
  if (!product) return null;

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600'];

  return (
    <div>
      <div className="page-hero pd-hero">
        <div className="container">
          <button className="btn btn-secondary btn-sm pd-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="breadcrumb">
            <a href="/">Home</a> / <a href="/products">Products</a> / {product.name}
          </div>
        </div>
      </div>

      <div className="container pd-page-body">
        <div className="layout-product-detail">
          {/* Images */}
          <div className="animate-left">
            <div className="pd-main-image-wrap">
              <img src={images[activeImg]} alt={product.name} className="pd-main-image"
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600'} />
            </div>
            {images.length > 1 && (
              <div className="pd-thumb-row">
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    className={`pd-thumb ${activeImg === i ? 'active' : ''}`}>
                    <img src={img} alt="" className="pd-thumb-img"
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=80'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="animate-right">
            <div className="pd-badges-row">
              <span className="badge badge-shipped">{product.category}</span>
              {product.isFeatured && <span className="badge badge-admin">⭐ Featured</span>}
              {product.slug && <span className="pd-slug-badge">/{product.slug}</span>}
            </div>
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating-row">
              <div className="pd-stars">{'⭐'.repeat(Math.round(product.rating || 4))}</div>
              <span className="pd-rating-value">{product.rating?.toFixed(1) || '4.0'}</span>
              <span className="pd-review-count">({product.numReviews} reviews)</span>
            </div>

            <div className="pd-price-row">
              <span className="pd-price">₹{product.price}</span>
              {product.originalPrice > product.price && <span className="pd-original-price">₹{product.originalPrice}</span>}
              {product.discount > 0 && <span className="badge badge-delivered pd-discount-badge">{product.discount}% OFF</span>}
            </div>

            <p className="pd-description">{product.description}</p>

            <div className="pd-chips-row">
              {[['🌿', 'Fresh', `${product.freshnessDays} Days`], ['📦', 'Stock', `${product.stock} units`], ['⚖️', 'Weight', product.weight]].map(([icon, label, val]) => (
                <div key={label} className="pd-chip">
                  <div className="pd-chip-icon">{icon}</div>
                  <div className="pd-chip-label">{label}</div>
                  <div className="pd-chip-value">{val}</div>
                </div>
              ))}
            </div>

            <div className="pd-qty-row">
              <span className="pd-qty-label">Quantity:</span>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="pd-qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>

            <div className="pd-actions-row">
              <button className="btn btn-primary btn-lg pd-action-btn" onClick={handleAddToCart} disabled={product.stock === 0}>🛒 Add to Cart</button>
              <button className="btn btn-secondary btn-lg pd-action-btn" onClick={handleBuyNow} disabled={product.stock === 0}>⚡ Buy Now</button>
            </div>

            {product.stock === 0 && (
              <div style={{ background: '#fff8f0', border: '2px solid #ffe0b2', borderRadius: 14, padding: '16px 18px', marginTop: 12 }}>
                <div style={{ fontWeight: 700, color: '#e65100', marginBottom: 8 }}>🔔 Get notified when back in stock</div>
                {onWaitlist ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#00b894', fontWeight: 600, fontSize: 14 }}>✅ You're on the waitlist!</span>
                    <button onClick={() => handleWaitlist(false)} disabled={waitlistLoading} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="Your email" className="form-input" style={{ flex: 1, padding: '8px 12px' }} />
                    <button onClick={() => handleWaitlist(true)} disabled={waitlistLoading} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      {waitlistLoading ? '...' : 'Notify Me'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`pd-wishlist-btn ${wishlisted ? 'active' : ''}`}
            >
              {wishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
            </button>

            {product.tags?.length > 0 && (
              <div className="pd-tags-wrap">
                {product.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
              </div>
            )}

            <div className="pd-delivery-box">
              <div className="pd-delivery-title">🚀 Delivery & Returns</div>
              <div className="pd-delivery-text">
                Free delivery on orders above ₹999 • Express delivery available • Easy 7-day returns
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="pd-reviews-section">
          <h2 className="section-title gradient-text pd-reviews-heading">Customer Reviews</h2>

          {user && (!myReview || editingReview) && (
            <form onSubmit={handleReview} className="pd-review-form">
              <div className="pd-review-form-header">
                <h3 className="pd-review-form-title">{myReview ? '✏️ Edit Your Review' : '📝 Write a Review'}</h3>
                {editingReview && (
                  <button type="button" onClick={() => { setEditingReview(false); setRating(myReview.rating); setComment(myReview.comment); }}
                    className="pd-review-form-close">✕</button>
                )}
              </div>
              <div className="pd-review-rating-field">
                <div className="pd-review-rating-label">Your Rating</div>
                <div className="pd-star-row">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button" onClick={() => setRating(r)}
                      className={`pd-star-btn ${r <= rating ? 'selected' : ''}`}>⭐</button>
                  ))}
                </div>
              </div>
              <textarea className="form-input" rows={3} placeholder="Share your experience with this product..." value={comment} onChange={e => setComment(e.target.value)} required />
              <div className="pd-review-form-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : myReview ? '✅ Update Review' : '📝 Submit Review'}
                </button>
                {editingReview && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingReview(false); setRating(myReview.rating); setComment(myReview.comment); }}>Cancel</button>
                )}
              </div>
            </form>
          )}

          {product.reviews?.length === 0 ? (
            <div className="empty-state pd-reviews-empty">
              <div className="empty-state-icon">💬</div>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="pd-reviews-list">
              {product.reviews?.map((rev, i) => {
                const isOwn = (rev.user?._id || rev.user)?.toString() === user?._id?.toString();
                return (
                  <div key={i} className={`pd-review-card ${isOwn ? 'own' : ''}`}>
                    <div className="pd-review-card-header">
                      <div className="pd-review-name-wrap">
                        <span className="pd-reviewer-name">{rev.name}</span>
                        {isOwn && <span className="pd-you-badge">You</span>}
                      </div>
                      <div className="pd-review-meta">
                        <span className="pd-review-date">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                        {isOwn && !editingReview && (
                          <button onClick={() => { setEditingReview(true); setRating(rev.rating); setComment(rev.comment); window.scrollTo({ top: document.querySelector('form')?.offsetTop - 100 || 0, behavior: 'smooth' }); }}
                            className="pd-review-edit-btn">
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pd-review-stars">{'⭐'.repeat(rev.rating)}</div>
                    <p className="pd-review-comment">{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Why Buy With Us */}
        <div className="pd-why-grid">
          {[['✅', '100% Authentic', 'Certified genuine product'], ['🚀', 'Fast Delivery', '2-4 business days'], ['🔄', '7-Day Returns', 'Hassle-free returns'], ['🔒', 'Secure Payments', 'Encrypted checkout']].map(([icon, title, desc]) => (
            <div key={title} className="pd-why-card">
              <div className="pd-why-icon">{icon}</div>
              <div className="pd-why-title">{title}</div>
              <div className="pd-why-desc">{desc}</div>
            </div>
          ))}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="pd-related-wrap">
            <h2 className="section-title gradient-text pd-related-heading">You May Also Like</h2>
            <div className="products-grid">
              {related.map((p) => (
                <div key={p._id} className="pd-related-card-wrap">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
