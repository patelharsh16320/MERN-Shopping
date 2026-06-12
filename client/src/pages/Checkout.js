import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, authAPI, couponAPI } from '../utils/api';
import { toast } from 'react-toastify';

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

  const shipping        = totalPrice > 999 ? 0 : 49;
  const tax             = Math.round(totalPrice * 0.18);
  const couponDiscount  = coupon?.discount || 0;
  const total           = totalPrice + shipping + tax - couponDiscount;

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
        discountPrice: couponDiscount, totalPrice: total,
        couponCode: coupon?.code || null,
        isPaid: !isCOD, paymentResult,
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
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {['Address', 'Payment', 'Review'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, background: step > i + 1 ? '#00b894' : step === i + 1 ? 'linear-gradient(135deg,#6c63ff,#fd79a8)' : '#e0e0f0', color: step >= i + 1 ? 'white' : '#636e72' }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: 14, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? '#6c63ff' : '#636e72' }}>{s}</span>
                {i < 2 && <div style={{ width: 40, height: 2, background: step > i + 1 ? '#00b894' : '#e0e0f0' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="layout-cart">
          <div className="animate-left">

            {/* ── Step 1: Address ── */}
            {step === 1 && (
              <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
                <h2 style={{ marginBottom: 24, fontWeight: 700 }}>📍 Delivery Address</h2>

                {/* Saved address cards */}
                {profileLoaded && savedAddresses.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Saved Addresses</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {savedAddresses.map(addr => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <div key={addr._id} onClick={() => selectSavedAddress(addr)}
                            style={{ padding: '14px 18px', border: `2px solid ${isSelected ? '#6c63ff' : '#e0e0f0'}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s', background: isSelected ? '#f0f0ff' : 'white' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `6px solid ${isSelected ? '#6c63ff' : '#e0e0e0'}`, flexShrink: 0, marginTop: 2, transition: 'all 0.2s' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.label || 'Address'}</span>
                                {addr.isDefault && (
                                  <span style={{ padding: '2px 8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Default</span>
                                )}
                              </div>
                              <div style={{ fontSize: 13, color: '#636e72', lineHeight: 1.6 }}>
                                {addr.street}<br />
                                {addr.city}, {addr.state} — {addr.zip}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* New address option */}
                      <div onClick={selectNewAddress}
                        style={{ padding: '14px 18px', border: `2px dashed ${selectedAddressId === 'new' ? '#6c63ff' : '#e0e0f0'}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', background: selectedAddressId === 'new' ? '#f0f0ff' : '#fafafa' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: selectedAddressId === 'new' ? '#6c63ff' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}>+</div>
                        <span style={{ fontWeight: 600, fontSize: 14, color: selectedAddressId === 'new' ? '#6c63ff' : '#636e72' }}>Use a different / new address</span>
                      </div>
                    </div>

                    {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                      <div style={{ margin: '20px 0 4px', display: 'flex', alignItems: 'center', gap: 10, color: '#bdbdbd', fontSize: 13 }}>
                        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                        Edit delivery details below
                        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Address form — always shown; auto-filled when saved address is selected */}
                <div style={{ marginTop: savedAddresses.length > 0 ? 8 : 0 }}>
                  <div className="form-group">
                    <label className="form-label">Street Address *</label>
                    <input className="form-input" placeholder="123 Main Street, Area" value={address.street} onChange={e => { setAddress({ ...address, street: e.target.value }); setSelectedAddressId('new'); }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input className="form-input" placeholder="Mumbai" value={address.city} onChange={e => { setAddress({ ...address, city: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input className="form-input" placeholder="Maharashtra" value={address.state} onChange={e => { setAddress({ ...address, state: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">ZIP Code *</label>
                      <input className="form-input" placeholder="400001" value={address.zip} onChange={e => { setAddress({ ...address, zip: e.target.value }); setSelectedAddressId('new'); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input className="form-input" value="India" readOnly style={{ background: '#f8f7ff' }} />
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} style={{ marginTop: 8 }}
                  disabled={!address.street || !address.city || !address.state || !address.zip}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && (
              <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
                <h2 style={{ marginBottom: 24, fontWeight: 700 }}>💳 Payment Method</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {paymentMethods.map(pm => (
                    <div key={pm.value}
                      onClick={() => { setPaymentMethod(pm.value); setSelectedCard(null); setDetails(emptyCard); }}
                      style={{ padding: '16px 20px', border: `2px solid ${paymentMethod === pm.value ? '#6c63ff' : '#e0e0f0'}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.3s', background: paymentMethod === pm.value ? '#f0f0ff' : 'white' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `6px solid ${paymentMethod === pm.value ? '#6c63ff' : '#e0e0f0'}`, transition: 'all 0.3s', flexShrink: 0 }} />
                      <span style={{ fontSize: 24 }}>{pm.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{pm.label}</span>
                      {pm.value === 'COD' && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#00b894', fontWeight: 600 }}>No details needed</span>}
                    </div>
                  ))}
                </div>

                {!isCOD && (
                  <div style={{ borderTop: '1px solid #e0e0f0', paddingTop: 24 }}>
                    {matchingSavedCards.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#424242' }}>💾 Saved Payment Methods</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {matchingSavedCards.map(card => (
                            <div key={card._id} onClick={() => setSelectedCard(selectedCard?._id === card._id ? null : card)}
                              style={{ padding: '12px 16px', border: `2px solid ${selectedCard?._id === card._id ? '#6c63ff' : '#e0e0f0'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: selectedCard?._id === card._id ? '#f0f0ff' : '#fafafa', transition: 'all 0.2s' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `5px solid ${selectedCard?._id === card._id ? '#6c63ff' : '#ccc'}`, flexShrink: 0 }} />
                              <div style={{ fontSize: 13 }}>
                                {isCard       && <span>💳 **** **** **** {card.last4} &nbsp;·&nbsp; {card.cardHolder} &nbsp;·&nbsp; {card.expiry}</span>}
                                {isUPI        && <span>📱 {card.upiId}</span>}
                                {isNetBanking && <span>🌐 {card.bankName}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#bdbdbd', fontSize: 13 }}>
                          <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />or add new<div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                        </div>
                      </div>
                    )}

                    {!selectedCard && (
                      <div>
                        {isCard && (
                          <div>
                            <div className="form-group">
                              <label className="form-label">Card Number *</label>
                              <input className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}
                                value={details.cardNumber}
                                onChange={e => setDetails(d => ({ ...d, cardNumber: formatCardNumber(e.target.value) }))}
                                style={{ letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: 16 }} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Cardholder Name *</label>
                              <input className="form-input" placeholder="Name on card" value={details.cardHolder} onChange={e => setDetails(d => ({ ...d, cardHolder: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <div className="form-group">
                                <label className="form-label">Expiry (MM/YY) *</label>
                                <input className="form-input" placeholder="MM/YY" maxLength={5} value={details.expiry} onChange={e => setDetails(d => ({ ...d, expiry: formatExpiry(e.target.value) }))} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">CVV *</label>
                                <div style={{ position: 'relative' }}>
                                  <input className="form-input" placeholder="•••" maxLength={4} type={showCvv ? 'text' : 'password'} value={details.cvv} onChange={e => setDetails(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} style={{ paddingRight: 44 }} />
                                  <button type="button" onClick={() => setShowCvv(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>{showCvv ? '🙈' : '👁'}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {isUPI && (
                          <div className="form-group">
                            <label className="form-label">UPI ID *</label>
                            <input className="form-input" placeholder="yourname@upi" value={details.upiId} onChange={e => setDetails(d => ({ ...d, upiId: e.target.value }))} />
                            <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 6 }}>e.g. name@okaxis, name@paytm, name@ybl</div>
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 8, fontSize: 14, color: '#424242' }}>
                          <input type="checkbox" checked={details.saveCard} onChange={e => setDetails(d => ({ ...d, saveCard: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#6c63ff' }} />
                          Save this payment method for future orders
                        </label>
                      </div>
                    )}

                    {selectedCard && (
                      <button onClick={() => setSelectedCard(null)} style={{ fontSize: 13, color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        + Use a different {isUPI ? 'UPI ID' : isNetBanking ? 'bank' : 'card'}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handlePaymentContinue} disabled={!paymentValid} style={{ opacity: paymentValid ? 1 : 0.5 }}>
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
                <h2 style={{ marginBottom: 24, fontWeight: 700 }}>📋 Order Review</h2>
                <div style={{ marginBottom: 20, padding: '16px 20px', background: '#f8f7ff', borderRadius: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>📍 Delivering to</div>
                  <div style={{ fontSize: 14, color: '#636e72' }}>{address.street}, {address.city}, {address.state} — {address.zip}</div>
                </div>
                <div style={{ marginBottom: 20, padding: '16px 20px', background: '#f8f7ff', borderRadius: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {paymentMethods.find(p => p.value === paymentMethod)?.icon} {paymentMethods.find(p => p.value === paymentMethod)?.label}
                  </div>
                  {!isCOD && <div style={{ fontSize: 13, color: '#636e72' }}>{paymentSummaryLabel()}</div>}
                  {!isCOD && <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Payment confirmed</span>}
                </div>
                {cartItems.map(item => (
                  <div key={item._id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px dashed #e0e0f0' }}>
                    <img src={item.images?.[0] || ''} alt={item.name} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div><div style={{ fontSize: 13, color: '#636e72' }}>Qty: {item.quantity}</div></div>
                    <div style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                    {loading ? '⏳ Placing Order...' : '🎉 Place Order — ₹' + total.toLocaleString()}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary sidebar ── */}
          <div className="order-summary animate-right">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px dashed #f0f0f0' }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="summary-row" style={{ marginTop: 8 }}><span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span style={{ color: shipping === 0 ? '#00b894' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span>₹{tax}</span></div>
            {coupon && (
              <div className="summary-row" style={{ color: '#388e3c' }}>
                <span>🎟️ Coupon ({coupon.code})</span>
                <span>−₹{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-total"><span>Total</span><span className="gradient-text">₹{total.toLocaleString()}</span></div>
            {shipping === 0 && <div style={{ marginTop: 10, padding: '8px 12px', background: '#e8f5e9', borderRadius: 10, fontSize: 12, color: '#2e7d32', fontWeight: 600, textAlign: 'center' }}>🎉 You qualify for free shipping!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
