import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './ProductCard.css';

const COMPARE_KEY = 'compare_list';
const MAX_COMPARE = 3;

function getCompareList() {
  try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]'); } catch { return []; }
}
function setCompareList(list) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare_updated'));
}

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isWishlisted = wishlistIds.includes(product._id);

  const handleCompare = (e) => {
    e.stopPropagation();
    const list = getCompareList();
    if (list.find(p => p._id === product._id)) {
      setCompareList(list.filter(p => p._id !== product._id));
      toast.info('Removed from compare', { autoClose: 1500 });
    } else if (list.length >= MAX_COMPARE) {
      toast.warning(`Max ${MAX_COMPARE} products can be compared`, { autoClose: 2000 });
    } else {
      setCompareList([...list, { _id: product._id, name: product.name, price: product.price, images: product.images, category: product.category, rating: product.rating, numReviews: product.numReviews, stock: product.stock, discount: product.discount, originalPrice: product.originalPrice, slug: product.slug }]);
      toast.success('Added to compare!', { autoClose: 1500 });
    }
  };

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
      <div className="product-card-media">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
          alt={product.name}
          className="product-card-img"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400'}
        />
        {product.isFeatured && <div className="product-badge">⭐ Featured</div>}
        {product.discount > 0 && (
          <div className={`discount-badge ${product.isFeatured ? 'featured-shift' : ''}`}>
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
          <span className="product-review-count">({product.numReviews || 0})</span>
        </div>
        <div className="product-price-section">
          <span className="product-price">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="product-original">₹{product.originalPrice}</span>
          )}
          {product.discount > 0 && <span className="product-discount">{product.discount}% off</span>}
        </div>
        <div className="product-card-actions">
          <button className="btn btn-primary btn-add-cart" onClick={handleAddToCart}
            disabled={product.stock === 0}>
            {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
          </button>
          <button onClick={handleCompare} style={{ background: 'none', border: '1.5px solid #e0e0e0', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#636e72', marginTop: 6, width: '100%' }}>
            ⚖️ Compare
          </button>
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <div className="low-stock-warning">⚡ Only {product.stock} left!</div>
        )}
      </div>
    </div>
  );
}
