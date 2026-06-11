import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isWishlisted = wishlistIds.includes(product._id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`🌿 ${product.name} added to cart!`, { autoClose: 2000 });
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.warning('Please login to use wishlist'); navigate('/login'); return; }
    try {
      const { data } = await authAPI.toggleWishlist(product._id);
      toast.success(data.added ? '🤍 Added to wishlist!' : 'Removed from wishlist', { autoClose: 1500 });
      if (onWishlistToggle) onWishlistToggle(product._id, data.added);
    } catch { toast.error('Failed to update wishlist'); }
  };

  const url = product.slug ? `/products/${product.slug}` : `/products/${product._id}`;

  return (
    <div className="product-card animate-fade" onClick={() => navigate(url)}>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          alt={product.name}
          className="product-card-img"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
        />
        {product.isFeatured && <div className="product-badge">⭐ Featured</div>}
        {product.discount > 0 && (
          <div style={{ position: 'absolute', top: 12, left: product.isFeatured ? 'auto' : 12, right: product.isFeatured ? 'auto' : 'auto', background: '#2e7d32', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, top: product.isFeatured ? 44 : 12, left: 12 }}>
            -{product.discount}%
          </div>
        )}
        <button
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-category">{product.category}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-rating">
          {'⭐'.repeat(Math.round(product.rating || 4))}
          <span style={{ color: '#558b2f', marginLeft: 4 }}>({product.numReviews || 0})</span>
        </div>
        <div className="product-price-section">
          <span className="product-price">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="product-original">₹{product.originalPrice}</span>
          )}
          {product.discount > 0 && <span className="product-discount">{product.discount}% off</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddToCart}
            disabled={product.stock === 0}>
            {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
          </button>
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#c62828', fontWeight: 600 }}>⚡ Only {product.stock} left!</div>
        )}
      </div>
    </div>
  );
}
