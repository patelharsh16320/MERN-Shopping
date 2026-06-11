import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, authAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';

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

  useEffect(() => {
    productAPI.getById(id)
      .then(r => {
        setProduct(r.data);
        setLoading(false);
        if (user) {
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
      <div className="page-hero" style={{ padding: '24px' }}>
        <div className="container">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="breadcrumb">
            <a href="/">Home</a> / <a href="/products">Products</a> / {product.name}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="layout-product-detail">
          {/* Images */}
          <div className="animate-left">
            <div style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--shadow-hover)' }}>
              <img src={images[activeImg]} alt={product.name} style={{ width: '100%', height: 450, objectFit: 'cover' }}
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600'} />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `3px solid ${activeImg === i ? 'var(--primary)' : 'transparent'}`, transition: 'all 0.3s' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=80'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="animate-right">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-shipped">{product.category}</span>
              {product.isFeatured && <span className="badge badge-admin">⭐ Featured</span>}
              {product.slug && <span style={{ fontSize: 12, color: '#558b2f', fontFamily: 'monospace', background: '#e8f5e9', padding: '2px 8px', borderRadius: 8 }}>/{product.slug}</span>}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ color: '#f9a825', fontSize: 20 }}>{'⭐'.repeat(Math.round(product.rating || 4))}</div>
              <span style={{ fontWeight: 600 }}>{product.rating?.toFixed(1) || '4.0'}</span>
              <span style={{ color: '#558b2f', fontSize: 14 }}>({product.numReviews} reviews)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: '#212121' }}>₹{product.price}</span>
              {product.originalPrice > product.price && <span style={{ fontSize: 20, textDecoration: 'line-through', color: '#9e9e9e' }}>₹{product.originalPrice}</span>}
              {product.discount > 0 && <span className="badge badge-delivered" style={{ fontSize: 14, padding: '6px 14px' }}>{product.discount}% OFF</span>}
            </div>

            <p style={{ color: '#558b2f', lineHeight: 1.8, marginBottom: 24, fontSize: 15 }}>{product.description}</p>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              {[['🌿', 'Fresh', `${product.freshnessDays} Days`], ['📦', 'Stock', `${product.stock} units`], ['⚖️', 'Weight', product.weight]].map(([icon, label, val]) => (
                <div key={label} style={{ background: '#e8f5e9', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: '#558b2f', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <span style={{ fontWeight: 600 }}>Quantity:</span>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddToCart} disabled={product.stock === 0}>🛒 Add to Cart</button>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBuyNow} disabled={product.stock === 0}>⚡ Buy Now</button>
            </div>

            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              style={{ width: '100%', padding: '12px', borderRadius: 50, border: `2px solid ${wishlisted ? '#c62828' : 'var(--border)'}`, background: wishlisted ? '#ffebee' : 'white', color: wishlisted ? '#c62828' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.3s' }}
            >
              {wishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
            </button>

            {product.tags?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                {product.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
              </div>
            )}

            <div style={{ marginTop: 24, padding: '16px', background: '#e8f5e9', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>🚀 Delivery & Returns</div>
              <div style={{ fontSize: 13, color: '#558b2f', lineHeight: 1.7 }}>
                Free delivery on orders above ₹999 • Express delivery available • Easy 7-day returns
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ background: 'white', borderRadius: 24, padding: 40, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <h2 className="section-title gradient-text" style={{ marginBottom: 32 }}>Customer Reviews</h2>

          {user && (!myReview || editingReview) && (
            <form onSubmit={handleReview} style={{ marginBottom: 40, background: '#f8f7ff', borderRadius: 16, padding: 24, border: '2px solid #ede7f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{myReview ? '✏️ Edit Your Review' : '📝 Write a Review'}</h3>
                {editingReview && (
                  <button type="button" onClick={() => { setEditingReview(false); setRating(myReview.rating); setComment(myReview.comment); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9e9e9e' }}>✕</button>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Your Rating</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button" onClick={() => setRating(r)}
                      style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', filter: r <= rating ? 'none' : 'grayscale(100%)', transition: 'all 0.2s', transform: r <= rating ? 'scale(1.1)' : 'scale(1)' }}>⭐</button>
                  ))}
                </div>
              </div>
              <textarea className="form-input" rows={3} placeholder="Share your experience with this product..." value={comment} onChange={e => setComment(e.target.value)} required />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
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
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-state-icon">💬</div>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {product.reviews?.map((rev, i) => {
                const isOwn = (rev.user?._id || rev.user)?.toString() === user?._id?.toString();
                return (
                  <div key={i} style={{ padding: 20, background: isOwn ? '#f8f7ff' : '#fafafa', borderRadius: 16, animation: `fadeIn ${0.3 + i * 0.1}s ease`, border: `1px solid ${isOwn ? '#ede7f6' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{rev.name}</span>
                        {isOwn && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'linear-gradient(135deg,#6c63ff,#fd79a8)', color: 'white', borderRadius: 20, marginLeft: 8 }}>You</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#9e9e9e', fontSize: 12 }}>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                        {isOwn && !editingReview && (
                          <button onClick={() => { setEditingReview(true); setRating(rev.rating); setComment(rev.comment); window.scrollTo({ top: document.querySelector('form')?.offsetTop - 100 || 0, behavior: 'smooth' }); }}
                            style={{ fontSize: 13, fontWeight: 600, color: '#6c63ff', background: '#f0f0ff', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ color: '#f9a825', marginBottom: 8, fontSize: 18 }}>{'⭐'.repeat(rev.rating)}</div>
                    <p style={{ color: '#636e72', fontSize: 14, lineHeight: 1.7 }}>{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Why Buy With Us */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 40 }}>
          {[['✅', '100% Authentic', 'Certified genuine product'], ['🚀', 'Fast Delivery', '2-4 business days'], ['🔄', '7-Day Returns', 'Hassle-free returns'], ['🔒', 'Secure Payments', 'Encrypted checkout']].map(([icon, title, desc]) => (
            <div key={title} style={{ background: 'white', borderRadius: 16, padding: '20px 16px', textAlign: 'center', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(194,24,91,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#757575' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 className="section-title gradient-text" style={{ marginBottom: 24 }}>You May Also Like</h2>
            <div className="products-grid">
              {related.map((p, i) => (
                <div key={p._id} style={{ animation: `fadeIn ${0.2 + i * 0.08}s ease` }}>
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
