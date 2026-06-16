import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import './Wishlist.css';

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authAPI.getProfile()
      .then(r => { setWishlist(r.data.wishlist || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, navigate]);

  const handleRemove = async (productId) => {
    try {
      await authAPI.toggleWishlist(productId);
      setWishlist(prev => prev.filter(p => (p._id || p) !== productId));
      toast.success('Removed from wishlist', { autoClose: 1500 });
    } catch { toast.error('Failed'); }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`🌿 ${product.name} added to cart!`, { autoClose: 2000 });
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <button className="btn btn-secondary btn-sm wishlist-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="section-title gradient-text">🤍 My Wishlist</h1>
          <p className="wishlist-count">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      <div className="container wishlist-page-body">
        {/* Wishlist tips strip */}
        {wishlist.length > 0 && (
          <div className="wishlist-tips-strip">
            <div className="wishlist-tips-left">
              <span className="wishlist-tips-icon">💡</span>
              <span className="wishlist-tips-text">Items in your wishlist won't expire, but stock may change. Add to cart before they sell out!</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { wishlist.forEach(p => { if (p._id && p.stock > 0) addToCart(p, 1); }); toast.success('All available items added to cart!'); }}>
              🛒 Add All to Cart
            </button>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="empty-state animate-zoom">
            <div className="empty-state-icon">🤍</div>
            <h3>Your wishlist is empty</h3>
            <p>Save items you love by clicking the heart icon on any product</p>
            <Link to="/products" className="btn btn-primary btn-lg wishlist-empty-cta">✨ Explore Products</Link>
          </div>
        ) : (
          <div className="products-grid">
            {wishlist.map((product) => {
              if (!product._id) return null;
              const url = product.slug ? `/products/${product.slug}` : `/products/${product._id}`;
              return (
                <div key={product._id} className="product-card animate-fade wishlist-card">
                  <div className="wishlist-card-media">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
                      alt={product.name}
                      className="product-card-img wishlist-card-img"
                      onClick={() => navigate(url)}
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
                    />
                    <button
                      className="wishlist-btn active"
                      onClick={() => handleRemove(product._id)}
                      title="Remove from wishlist"
                    >
                      ❤️
                    </button>
                  </div>
                  <div className="product-card-body">
                    <div className="product-category">{product.category}</div>
                    <div className="product-name wishlist-card-name" onClick={() => navigate(url)}>{product.name}</div>
                    <div className="product-price-section">
                      <span className="product-price">₹{product.price}</span>
                    </div>
                    <div className="wishlist-card-actions">
                      <button className="btn btn-primary wishlist-card-add-btn"
                        onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                        {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                      </button>
                      <button className="btn btn-secondary btn-sm wishlist-card-view-btn" onClick={() => navigate(url)}>View</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
