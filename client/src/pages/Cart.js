import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { couponAPI } from '../utils/api';
import { toast } from 'react-toastify';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

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

  const shipping = totalPrice > 999 ? 0 : 49;
  const tax = Math.round(totalPrice * 0.18);
  const total = totalPrice + shipping + tax - couponDiscount;

  const handleCheckout = () => {
    if (!user) { toast.warning('Please login to continue'); navigate('/login'); return; }
    navigate('/checkout', { state: couponData ? { coupon: { id: couponData._id, code: couponData.code, discount: couponDiscount } } : undefined });
  };

  if (cartItems.length === 0) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state animate-zoom">
        <div className="empty-state-icon">🛒</div>
        <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
        <p>Add some beautiful flowers to get started!</p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>🌸 Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">🛒 Shopping Cart</h1>
          <p style={{ color: '#636e72' }}>{totalItems} item{totalItems > 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="layout-cart">
          <div className="animate-left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>Cart Items ({totalItems})</h3>
              <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#d63031', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14 }}>🗑 Clear Cart</button>
            </div>

            {cartItems.map(item => (
              <div key={item._id} className="cart-item">
                <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} alt={item.name} className="cart-item-img"
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1490750967868-88df5691cc45?w=200'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: '#636e72', marginBottom: 8 }}>{item.category}</div>
                  <div style={{ fontWeight: 700, color: '#6c63ff', fontSize: 18 }}>₹{item.price}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <button onClick={() => removeFromCart(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d63031', fontSize: 18 }}>✕</button>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              </div>
            ))}

            <div style={{ padding: '20px', background: '#e8f8f2', borderRadius: 16, marginTop: 16 }}>
              <div style={{ fontWeight: 600, color: '#00b894', marginBottom: 4 }}>🎉 {totalPrice > 999 ? 'Free delivery applied!' : `Add ₹${999 - totalPrice} more for free delivery!`}</div>
              <div style={{ fontSize: 13, color: '#636e72' }}>Free delivery on orders above ₹999</div>
            </div>
          </div>

          <div className="order-summary animate-right">
            <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 20 }}>Order Summary</h3>
            <div className="summary-row"><span>Subtotal ({totalItems} items)</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span style={{ color: shipping === 0 ? '#00b894' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{tax}</span></div>
            {couponData && (
              <div className="summary-row" style={{ color: '#388e3c' }}>
                <span>🎟️ Coupon ({couponData.code})</span>
                <span>−₹{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-total"><span>Total Amount</span><span className="gradient-text">₹{total.toLocaleString()}</span></div>
            {totalPrice > 0 && <div style={{ fontSize: 13, color: '#00b894', marginTop: 6, textAlign: 'right' }}>You save ₹{(cartItems.reduce((s, i) => s + ((i.originalPrice || i.price) - i.price) * i.quantity, 0) + couponDiscount).toLocaleString()}</div>}

            {/* Coupon code */}
            {!couponData ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#636e72', marginBottom: 8 }}>🎟️ Have a coupon code?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="Enter coupon code"
                    value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace', letterSpacing: 1 }} />
                  <button className="btn btn-secondary btn-sm" onClick={handleApplyCoupon}
                    disabled={couponLoading} style={{ whiteSpace: 'nowrap' }}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f5e9', borderRadius: 12, padding: '10px 14px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#2e7d32', fontSize: 13 }}>🎟️ {couponData.code}</span>
                  <div style={{ fontSize: 12, color: '#388e3c' }}>
                    {couponData.discountType === 'percentage' ? `${couponData.discountValue}% off` : `₹${couponData.discountValue} off`} applied
                  </div>
                </div>
                <button onClick={handleRemoveCoupon}
                  style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>✕</button>
              </div>
            )}

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} onClick={handleCheckout}>
              🔒 Proceed to Checkout
            </button>
            <Link to="/products" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>← Continue Shopping</Link>

            {/* Trust badges */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[['🔒', 'Secure Checkout'], ['🚀', 'Fast Delivery'], ['🔄', '7-Day Returns']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#757575' }}>
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
