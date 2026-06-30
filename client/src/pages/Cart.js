import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { couponAPI, loyaltyAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './Cart.css';

const SAVED_KEY = 'cart_saved_for_later';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, addToCart, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [savedItems, setSavedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
  });

  const persistSaved = (items) => {
    setSavedItems(items);
    localStorage.setItem(SAVED_KEY, JSON.stringify(items));
  };

  const saveForLater = (item) => {
    removeFromCart(item._id);
    persistSaved([...savedItems.filter(s => s._id !== item._id), item]);
    toast.info(`🔖 "${item.name}" saved for later`);
  };

  const moveToCart = (item) => {
    addToCart(item, 1);
    persistSaved(savedItems.filter(s => s._id !== item._id));
    toast.success(`🛒 "${item.name}" moved to cart`);
  };

  const removeSaved = (id) => {
    persistSaved(savedItems.filter(s => s._id !== id));
  };

  useEffect(() => {
    if (user) loyaltyAPI.getMyLoyalty().then(({ data }) => setLoyaltyInfo(data)).catch(() => {});
  }, [user]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('Enter a coupon code');
    setCouponLoading(true);
    try {
      const { data } = await couponAPI.validate(couponCode.trim(), totalPrice);
      setCouponData(data.coupon);
      setCouponDiscount(data.discount);
      toast.success(`🎉 Coupon "${data.coupon.code}" applied! You save ₹${data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleApplyLoyalty = async () => {
    const pts = parseInt(loyaltyPoints);
    if (!pts || pts <= 0) return toast.error('Enter valid points');
    if (!loyaltyInfo || pts > loyaltyInfo.points) return toast.error(`You only have ${loyaltyInfo?.points || 0} points`);
    try {
      const { data } = await loyaltyAPI.redeem(pts);
      setLoyaltyDiscount(data.discount);
      setLoyaltyPointsUsed(pts);
      toast.success(`⭐ ${pts} points applied! You save ₹${data.discount}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply points'); }
  };

  const handleRemoveLoyalty = () => { setLoyaltyDiscount(0); setLoyaltyPointsUsed(0); setLoyaltyPoints(''); };

  const shipping = totalPrice > 999 ? 0 : 49;
  const tax = Math.round(totalPrice * 0.18);
  const total = totalPrice + shipping + tax - couponDiscount - loyaltyDiscount;

  const handleCheckout = () => {
    if (!user) { toast.warning('Please login to continue'); navigate('/login'); return; }
    navigate('/checkout', { state: { coupon: couponData ? { id: couponData._id, code: couponData.code, discount: couponDiscount } : null, loyaltyPointsUsed: loyaltyPointsUsed || 0, loyaltyDiscount: loyaltyDiscount || 0 } });
  };

  if (cartItems.length === 0) return (
    <div className="cart-empty-wrap">
      <div className="empty-state animate-zoom">
        <div className="empty-state-icon">🛒</div>
        <h2 className="cart-empty-heading">Your cart is empty</h2>
        <p>Add some beautiful flowers to get started!</p>
        <Link to="/products" className="btn btn-primary btn-lg cart-empty-cta">🌸 Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">🛒 Shopping Cart</h1>
          <p className="cart-page-subtitle">{totalItems} item{totalItems > 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="container cart-page-body">
        <div className="layout-cart">
          <div className="animate-left">
            <div className="cart-items-header">
              <h3 className="cart-items-title">Cart Items ({totalItems})</h3>
              <button onClick={clearCart} className="cart-clear-btn">🗑 Clear Cart</button>
            </div>

            {cartItems.map(item => (
              <div key={item._id} className="cart-item">
                <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} alt={item.name} className="cart-item-img"
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-category">{item.category}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                </div>
                <div className="cart-item-right">
                  <button onClick={() => removeFromCart(item._id)} className="cart-item-remove-btn">✕</button>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                    <span className="cart-qty-display">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-subtotal">₹{(item.price * item.quantity).toLocaleString()}</div>
                  <button onClick={() => saveForLater(item)} style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>🔖 Save for later</button>
                </div>
              </div>
            ))}

            <div className="cart-delivery-banner">
              <div className="cart-delivery-title">🎉 {totalPrice > 999 ? 'Free delivery applied!' : `Add ₹${999 - totalPrice} more for free delivery!`}</div>
              <div className="cart-delivery-sub">Free delivery on orders above ₹999</div>
            </div>

            {savedItems.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#6c63ff' }}>🔖 Saved for Later ({savedItems.length})</h3>
                {savedItems.map(item => (
                  <div key={item._id} className="cart-item" style={{ opacity: 0.85 }}>
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} alt={item.name} className="cart-item-img"
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-category">{item.category}</div>
                      <div className="cart-item-price">₹{item.price}</div>
                    </div>
                    <div className="cart-item-right">
                      <button onClick={() => removeSaved(item._id)} className="cart-item-remove-btn">✕</button>
                      <button onClick={() => moveToCart(item)} style={{ background: 'none', border: 'none', color: '#00b894', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 0', marginTop: 6 }}>🛒 Move to cart</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="order-summary animate-right">
            <h3 className="cart-summary-title">Order Summary</h3>
            <div className="summary-row"><span>Subtotal ({totalItems} items)</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span className={shipping === 0 ? 'cart-delivery-free' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{tax}</span></div>
            {couponData && (
              <div className="summary-row cart-summary-row-coupon">
                <span>🎟️ Coupon ({couponData.code})</span>
                <span>−₹{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="summary-row cart-summary-row-loyalty">
                <span>⭐ Points ({loyaltyPointsUsed} pts)</span>
                <span>−₹{loyaltyDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-total"><span>Total Amount</span><span className="gradient-text">₹{total.toLocaleString()}</span></div>
            {totalPrice > 0 && <div className="cart-savings-text">You save ₹{(cartItems.reduce((s, i) => s + ((i.originalPrice || i.price) - i.price) * i.quantity, 0) + couponDiscount + loyaltyDiscount).toLocaleString()}</div>}

            {/* Coupon code */}
            {!couponData ? (
              <div className="cart-coupon-section">
                <div className="cart-mini-label">🎟️ Have a coupon code?</div>
                <div className="cart-inline-row">
                  <input className="form-input cart-coupon-input" placeholder="Enter coupon code"
                    value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} />
                  <button className="btn btn-secondary btn-sm cart-nowrap-btn" onClick={handleApplyCoupon}
                    disabled={couponLoading}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="cart-coupon-applied">
                <div>
                  <span className="cart-coupon-applied-code">🎟️ {couponData.code}</span>
                  <div className="cart-coupon-applied-detail">
                    {couponData.discountType === 'percentage' ? `${couponData.discountValue}% off` : `₹${couponData.discountValue} off`} applied
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} className="cart-remove-btn">✕</button>
              </div>
            )}

            {/* Loyalty points */}
            {user && loyaltyInfo && loyaltyInfo.points > 0 && !loyaltyPointsUsed && (
              <div className="cart-loyalty-section">
                <div className="cart-mini-label">⭐ Use Loyalty Points ({loyaltyInfo.points} available ≈ ₹{Math.floor(loyaltyInfo.points * 0.5)} value)</div>
                <div className="cart-inline-row">
                  <input className="form-input cart-loyalty-input" type="number" min="1" max={loyaltyInfo.points} placeholder={`Max ${loyaltyInfo.points}`}
                    value={loyaltyPoints} onChange={e => setLoyaltyPoints(e.target.value)} />
                  <button className="btn btn-secondary btn-sm cart-nowrap-btn" onClick={handleApplyLoyalty}>
                    Redeem
                  </button>
                </div>
              </div>
            )}
            {loyaltyPointsUsed > 0 && (
              <div className="cart-loyalty-applied">
                <div>
                  <span className="cart-loyalty-applied-text">⭐ {loyaltyPointsUsed} points applied</span>
                  <div className="cart-loyalty-applied-detail">Saving ₹{loyaltyDiscount}</div>
                </div>
                <button onClick={handleRemoveLoyalty} className="cart-remove-btn">✕</button>
              </div>
            )}

            <button className="btn btn-primary btn-lg cart-checkout-btn" onClick={handleCheckout}>
              🔒 Proceed to Checkout
            </button>
            <Link to="/products" className="btn btn-secondary cart-continue-btn">← Continue Shopping</Link>

            {/* Trust badges */}
            <div className="cart-trust-wrap">
              {[['🔒', 'Secure Checkout'], ['🚀', 'Fast Delivery'], ['🔄', '7-Day Returns']].map(([icon, label]) => (
                <div key={label} className="cart-trust-item">
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
