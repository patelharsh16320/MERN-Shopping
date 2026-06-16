import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, authAPI, couponAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './Checkout.css';

const paymentMethods = [
  { value: 'COD',          label: 'Cash on Delivery', icon: '💵' },
  { value: 'UPI',          label: 'UPI Payment',       icon: '📱' },
  { value: 'Credit Card',  label: 'Credit Card',       icon: '💳' },
  { value: 'Debit Card',   label: 'Debit Card',        icon: '🏦' },
  { value: 'Net Banking',  label: 'Net Banking',       icon: '🌐' },
];

const banks = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Yes Bank', 'IndusInd Bank'];
const emptyCard = { cardNumber: '', cardHolder: '', expiry: '', cvv: '', upiId: '', bankName: banks[0], saveCard: false };
const emptyAddress = { street: '', city: '', state: '', zip: '', country: 'India' };

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const coupon = location.state?.coupon || null;
  const loyaltyPointsUsed = location.state?.loyaltyPointsUsed || 0;
  const loyaltyDiscount   = location.state?.loyaltyDiscount || 0;

  const [loading, setLoading]               = useState(false);
  const [address, setAddress]               = useState(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // _id of picked saved address, or 'new'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [profileLoaded, setProfileLoaded]   = useState(false);

  const [paymentMethod, setPaymentMethod]   = useState('COD');
  const [step, setStep]                     = useState(1);
  const [details, setDetails]               = useState(emptyCard);
  const [showCvv, setShowCvv]               = useState(false);
  const [savedCards, setSavedCards]         = useState([]);
  const [selectedCard, setSelectedCard]     = useState(null);
  const [giftPacking, setGiftPacking]       = useState({ enabled: false, size: 'Small', message: '' });

  const GIFT_PRICES = { Small: 50, Medium: 100, Large: 150 };
  const shipping        = totalPrice > 999 ? 0 : 49;
  const tax             = Math.round(totalPrice * 0.18);
  const couponDiscount  = coupon?.discount || 0;
  const giftCharge      = giftPacking.enabled ? (GIFT_PRICES[giftPacking.size] || 50) : 0;
  const total           = totalPrice + shipping + tax - couponDiscount - loyaltyDiscount + giftCharge;

  const isCOD        = paymentMethod === 'COD';
  const isCard       = paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card';
  const isUPI        = paymentMethod === 'UPI';
  const isNetBanking = paymentMethod === 'Net Banking';

  // ── Load saved addresses from fresh profile ──
  useEffect(() => {
    if (!user) return;
    authAPI.getProfile()
      .then(r => {
        const profile = r.data;
        const addrs = profile.addresses || [];
        setSavedAddresses(addrs);

        // pick default or first saved address
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def) {
          setSelectedAddressId(def._id);
          setAddress({ street: def.street, city: def.city, state: def.state, zip: def.zip, country: def.country || 'India' });
        } else if (profile.address?.street) {
          // legacy single address fallback
          setAddress({ street: profile.address.street, city: profile.address.city, state: profile.address.state, zip: profile.address.zip, country: profile.address.country || 'India' });
          setSelectedAddressId('legacy');
        } else {
          setSelectedAddressId('new');
        }
        setProfileLoaded(true);
      })
      .catch(() => {
        // fall back to whatever is in localStorage
        if (user?.address?.street) {
          setAddress({ street: user.address.street, city: user.address.city, state: user.address.state, zip: user.address.zip, country: user.address.country || 'India' });
          setSelectedAddressId('legacy');
        } else {
          setSelectedAddressId('new');
        }
        setProfileLoaded(true);
      });
  }, [user]); // eslint-disable-line

  // ── Load saved payment cards when reaching step 2 ──
  useEffect(() => {
    if (step === 2 && !isCOD) {
      authAPI.getCards().then(r => setSavedCards(r.data)).catch(() => {});
    }
  }, [step, isCOD]);

  const selectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setAddress({ street: addr.street, city: addr.city, state: addr.state, zip: addr.zip, country: addr.country || 'India' });
  };

  const selectNewAddress = () => {
    setSelectedAddressId('new');
    setAddress(emptyAddress);
  };

  const matchingSavedCards = savedCards.filter(c => c.type === paymentMethod);

  const paymentValid = isCOD || selectedCard ||
    (isCard       && details.cardNumber.replace(/\s/g, '').length === 16 && details.cardHolder.trim() && details.expiry.length === 5 && details.cvv.length >= 3) ||
    (isUPI        && details.upiId.includes('@')) ||
    (isNetBanking && details.bankName);

  const handlePaymentContinue = async () => {
    if (!paymentValid) { toast.error('Please fill in all payment details'); return; }
    if (!isCOD && !selectedCard && details.saveCard) {
      try {
        const cardPayload = isCard
          ? { type: paymentMethod, last4: details.cardNumber.replace(/\s/g, '').slice(-4), cardHolder: details.cardHolder, expiry: details.expiry }
          : isUPI ? { type: 'UPI', upiId: details.upiId }
                  : { type: 'Net Banking', bankName: details.bankName };
        const res = await authAPI.saveCard(cardPayload);
        setSavedCards(res.data);
        toast.success('Payment method saved!');
      } catch { toast.error('Could not save payment method'); }
    }
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.zip) { toast.error('Please fill all address fields'); return; }
    setLoading(true);
    try {
      const orderItems = cartItems.map(item => ({ product: item._id, name: item.name, image: item.images?.[0] || '', price: item.price, quantity: item.quantity }));

      let paymentResult = null;
      if (!isCOD) {
        const src = selectedCard || null;
        paymentResult = {
          id:         'TXN' + Date.now(),
          status:     'COMPLETED',
          updateTime: new Date().toISOString(),
          cardLast4:  src ? src.last4     : isCard        ? details.cardNumber.replace(/\s/g, '').slice(-4) : '',
          cardHolder: src ? src.cardHolder: isCard        ? details.cardHolder : '',
          upiId:      src ? src.upiId     : isUPI         ? details.upiId : '',
          bankName:   src ? src.bankName  : isNetBanking  ? details.bankName : '',
        };
      }

      const { data } = await orderAPI.create({
        orderItems, shippingAddress: address, paymentMethod,
        itemsPrice: totalPrice, shippingPrice: shipping, taxPrice: tax,
        discountPrice: couponDiscount + loyaltyDiscount, totalPrice: total,
        couponCode: coupon?.code || null,
        isPaid: !isCOD, paymentResult,
        loyaltyPointsUsed: loyaltyPointsUsed || 0,
        giftPacking: giftPacking.enabled
          ? { enabled: true, size: giftPacking.size, price: giftCharge, message: giftPacking.message }
          : { enabled: false },
      });
      if (coupon?.id) { couponAPI.recordUsage(coupon.id).catch(() => {}); }
      clearCart();
      toast.success('🎉 Order placed successfully!');
      navigate(`/orders/${data._id}`, { state: { fromCheckout: true } });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to place order'); }
    setLoading(false);
  };

  const paymentSummaryLabel = () => {
    const src = selectedCard;
    if (isCard)       return src ? `**** **** **** ${src.last4} — ${src.cardHolder}` : `**** **** **** ${details.cardNumber.replace(/\s/g,'').slice(-4) || '????'} — ${details.cardHolder}`;
    if (isUPI)        return `UPI: ${src ? src.upiId : details.upiId}`;
    if (isNetBanking) return `Bank: ${src ? src.bankName : details.bankName}`;
    return 'Cash on Delivery';
  };

  if (cartItems.length === 0) { navigate('/cart'); return null; }

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">🔒 Checkout</h1>
          <div className="co-steps-row">
            {['Address', 'Payment', 'Review'].map((s, i) => (
              <div key={s} className="co-step-item">
                <div className={`co-step-circle ${step > i + 1 ? 'done' : step === i + 1 ? 'current' : ''}`}>{step > i + 1 ? '✓' : i + 1}</div>
                <span className={`co-step-label ${step === i + 1 ? 'current' : ''}`}>{s}</span>
                {i < 2 && <div className={`co-step-line ${step > i + 1 ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container co-page-body">
        <div className="layout-cart">
          <div className="animate-left">

            {/* ── Step 1: Address ── */}
            {step === 1 && (
              <div className="co-panel">
                <h2 className="co-panel-heading">📍 Delivery Address</h2>

                {/* Saved address cards */}
                {profileLoaded && savedAddresses.length > 0 && (
                  <div className="co-saved-section">
                    <div className="co-section-label">Saved Addresses</div>
                    <div className="co-addr-list">
                      {savedAddresses.map(addr => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <div key={addr._id} onClick={() => selectSavedAddress(addr)}
                            className={`co-addr-card ${isSelected ? 'selected' : ''}`}>
                            <div className={`co-radio-dot ${isSelected ? 'selected' : ''}`} />
                            <div className="co-addr-card-body">
                              <div className="co-addr-name-row">
                                <span className="co-addr-name">{addr.label || 'Address'}</span>
                                {addr.isDefault && (
                                  <span className="co-default-badge">Default</span>
                                )}
                              </div>
                              <div className="co-addr-detail">
                                {addr.street}<br />
                                {addr.city}, {addr.state} — {addr.zip}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* New address option */}
                      <div onClick={selectNewAddress}
                        className={`co-new-addr-card ${selectedAddressId === 'new' ? 'selected' : ''}`}>
                        <div className={`co-new-addr-icon ${selectedAddressId === 'new' ? 'selected' : ''}`}>+</div>
                        <span className={`co-new-addr-label ${selectedAddressId === 'new' ? 'selected' : ''}`}>Use a different / new address</span>
                      </div>
                    </div>

                    {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                      <div className="co-divider-row">
                        <div className="co-divider-line" />
                        Edit delivery details below
                        <div className="co-divider-line" />
                      </div>
                    )}
                  </div>
                )}

                {/* Address form — always shown; auto-filled when saved address is selected */}
                <div className={`co-addr-form ${savedAddresses.length > 0 ? 'with-saved' : ''}`}>
                  <div className="form-group">
                    <label className="form-label">Street Address *</label>
                    <input className="form-input" placeholder="123 Main Street, Area" value={address.street} onChange={e => { setAddress({ ...address, street: e.target.value }); setSelectedAddressId('new'); }} />
                  </div>
                  <div className="co-form-grid-2">
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input className="form-input" placeholder="Mumbai" value={address.city} onChange={e => { setAddress({ ...address, city: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input className="form-input" placeholder="Maharashtra" value={address.state} onChange={e => { setAddress({ ...address, state: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                  </div>
                  <div className="co-form-grid-2">
                    <div className="form-group">
                      <label className="form-label">ZIP Code *</label>
                      <input className="form-input" placeholder="400001" value={address.zip} onChange={e => { setAddress({ ...address, zip: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input className="form-input co-readonly-input" value="India" readOnly />
                    </div>
                  </div>
                </div>

                {/* Gift Packing */}
                <div className="co-gift-box">
                  <label className="co-gift-label-row">
                    <input type="checkbox" checked={giftPacking.enabled} onChange={e => setGiftPacking(g => ({ ...g, enabled: e.target.checked }))}
                      className="co-gift-checkbox" />
                    <span className="co-gift-title">🎁 Add Gift Packing</span>
                    <span className="co-gift-hint">Small ₹50 · Medium ₹100 · Large ₹150</span>
                  </label>
                  {giftPacking.enabled && (
                    <div className="co-gift-options">
                      <div className="co-gift-size-row">
                        {['Small', 'Medium', 'Large'].map(sz => (
                          <button key={sz} onClick={() => setGiftPacking(g => ({ ...g, size: sz }))}
                            className={`co-gift-size-btn ${giftPacking.size === sz ? 'selected' : ''}`}>
                            {sz}<br /><span className="co-gift-size-price">₹{GIFT_PRICES[sz]}</span>
                          </button>
                        ))}
                      </div>
                      <div className="form-group co-gift-message-field">
                        <label className="form-label">Gift Message (optional)</label>
                        <textarea className="form-input co-gift-textarea" rows={2} placeholder="Write a personal message…" value={giftPacking.message}
                          onChange={e => setGiftPacking(g => ({ ...g, message: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>

                <button className="btn btn-primary btn-lg co-continue-btn" onClick={() => setStep(2)}
                  disabled={!address.street || !address.city || !address.state || !address.zip}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && (
              <div className="co-panel">
                <h2 className="co-panel-heading">💳 Payment Method</h2>

                <div className="co-pm-list">
                  {paymentMethods.map(pm => (
                    <div key={pm.value}
                      onClick={() => { setPaymentMethod(pm.value); setSelectedCard(null); setDetails(emptyCard); }}
                      className={`co-pm-card ${paymentMethod === pm.value ? 'selected' : ''}`}>
                      <div className={`co-radio-dot ${paymentMethod === pm.value ? 'selected' : ''}`} />
                      <span className="co-pm-icon">{pm.icon}</span>
                      <span className="co-pm-label">{pm.label}</span>
                      {pm.value === 'COD' && <span className="co-pm-hint">No details needed</span>}
                    </div>
                  ))}
                </div>

                {!isCOD && (
                  <div className="co-payment-details">
                    {matchingSavedCards.length > 0 && (
                      <div className="co-saved-cards-section">
                        <div className="co-saved-cards-label">💾 Saved Payment Methods</div>
                        <div className="co-saved-cards-list">
                          {matchingSavedCards.map(card => (
                            <div key={card._id} onClick={() => setSelectedCard(selectedCard?._id === card._id ? null : card)}
                              className={`co-saved-card ${selectedCard?._id === card._id ? 'selected' : ''}`}>
                              <div className={`co-radio-dot-sm ${selectedCard?._id === card._id ? 'selected' : ''}`} />
                              <div className="co-saved-card-text">
                                {isCard       && <span>💳 **** **** **** {card.last4} &nbsp;·&nbsp; {card.cardHolder} &nbsp;·&nbsp; {card.expiry}</span>}
                                {isUPI        && <span>📱 {card.upiId}</span>}
                                {isNetBanking && <span>🌐 {card.bankName}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="co-divider-row">
                          <div className="co-divider-line" />or add new<div className="co-divider-line" />
                        </div>
                      </div>
                    )}

                    {!selectedCard && (
                      <div>
                        {isCard && (
                          <div>
                            <div className="form-group">
                              <label className="form-label">Card Number *</label>
                              <input className="form-input co-card-number-input" placeholder="1234 5678 9012 3456" maxLength={19}
                                value={details.cardNumber}
                                onChange={e => setDetails(d => ({ ...d, cardNumber: formatCardNumber(e.target.value) }))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Cardholder Name *</label>
                              <input className="form-input" placeholder="Name on card" value={details.cardHolder} onChange={e => setDetails(d => ({ ...d, cardHolder: e.target.value }))} />
                            </div>
                            <div className="co-form-grid-2">
                              <div className="form-group">
                                <label className="form-label">Expiry (MM/YY) *</label>
                                <input className="form-input" placeholder="MM/YY" maxLength={5} value={details.expiry} onChange={e => setDetails(d => ({ ...d, expiry: formatExpiry(e.target.value) }))} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">CVV *</label>
                                <div className="co-cvv-wrap">
                                  <input className="form-input co-cvv-input" placeholder="•••" maxLength={4} type={showCvv ? 'text' : 'password'} value={details.cvv} onChange={e => setDetails(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                                  <button type="button" onClick={() => setShowCvv(v => !v)} className="co-cvv-toggle">{showCvv ? '🙈' : '👁'}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {isUPI && (
                          <div className="form-group">
                            <label className="form-label">UPI ID *</label>
                            <input className="form-input" placeholder="yourname@upi" value={details.upiId} onChange={e => setDetails(d => ({ ...d, upiId: e.target.value }))} />
                            <div className="co-upi-hint">e.g. name@okaxis, name@paytm, name@ybl</div>
                          </div>
                        )}
                        {isNetBanking && (
                          <div className="form-group">
                            <label className="form-label">Select Bank *</label>
                            <select className="form-select" value={details.bankName} onChange={e => setDetails(d => ({ ...d, bankName: e.target.value }))}>
                              {banks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                        )}
                        <label className="co-save-method-label">
                          <input type="checkbox" checked={details.saveCard} onChange={e => setDetails(d => ({ ...d, saveCard: e.target.checked }))} className="co-save-method-checkbox" />
                          Save this payment method for future orders
                        </label>
                      </div>
                    )}

                    {selectedCard && (
                      <button onClick={() => setSelectedCard(null)} className="co-use-different-btn">
                        + Use a different {isUPI ? 'UPI ID' : isNetBanking ? 'bank' : 'card'}
                      </button>
                    )}
                  </div>
                )}

                <div className="co-step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className={`btn btn-primary btn-lg co-review-btn ${paymentValid ? 'valid' : ''}`} onClick={handlePaymentContinue} disabled={!paymentValid}>
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="co-panel">
                <h2 className="co-panel-heading">📋 Order Review</h2>
                <div className="co-review-box">
                  <div className="co-review-box-title">📍 Delivering to</div>
                  <div className="co-review-text">{address.street}, {address.city}, {address.state} — {address.zip}</div>
                </div>
                <div className="co-review-box">
                  <div className="co-review-box-title">
                    {paymentMethods.find(p => p.value === paymentMethod)?.icon} {paymentMethods.find(p => p.value === paymentMethod)?.label}
                  </div>
                  {!isCOD && <div className="co-review-text">{paymentSummaryLabel()}</div>}
                  {!isCOD && <span className="co-confirmed-badge">✓ Payment confirmed</span>}
                </div>
                {cartItems.map(item => (
                  <div key={item._id} className="co-review-item">
                    <img src={item.images?.[0] || ''} alt={item.name} className="co-review-item-img" />
                    <div className="co-review-item-info"><div className="co-review-item-name">{item.name}</div><div className="co-review-item-qty">Qty: {item.quantity}</div></div>
                    <div className="co-review-item-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                <div className="co-step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-lg co-place-order-btn" onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? '⏳ Placing Order...' : '🎉 Place Order — ₹' + total.toLocaleString()}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary sidebar ── */}
          <div className="order-summary animate-right">
            <h3 className="co-summary-heading">Order Summary</h3>
            {cartItems.map(item => (
              <div key={item._id} className="co-summary-item-row">
                <span>{item.name} × {item.quantity}</span>
                <span className="co-summary-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="summary-row co-summary-first"><span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span className={shipping === 0 ? 'co-free-text' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{tax}</span></div>
            {coupon && (
              <div className="summary-row co-row-coupon">
                <span>🎟️ Coupon ({coupon.code})</span>
                <span>−₹{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="summary-row co-row-loyalty">
                <span>⭐ Loyalty Points ({loyaltyPointsUsed} pts)</span>
                <span>−₹{loyaltyDiscount.toLocaleString()}</span>
              </div>
            )}
            {giftPacking.enabled && (
              <div className="summary-row co-row-gift">
                <span>🎁 Gift Packing ({giftPacking.size})</span>
                <span>+₹{giftCharge}</span>
              </div>
            )}
            <div className="summary-total"><span>Total</span><span className="gradient-text">₹{total.toLocaleString()}</span></div>
            {shipping === 0 && <div className="co-free-shipping-banner">🎉 You qualify for free shipping!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
