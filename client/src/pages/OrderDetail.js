import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const statusSteps  = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled', Returned: 'returned' };
const statusIcons  = { Pending: '📋', Processing: '⚙️', Shipped: '🚚', Delivered: '✅', Cancelled: '❌', Returned: '↩️' };

function paymentLabel(order) {
  const pr = order.paymentResult;
  if (!pr) return null;
  if (pr.cardLast4) return `**** **** **** ${pr.cardLast4}${pr.cardHolder ? ` — ${pr.cardHolder}` : ''}`;
  if (pr.upiId)    return `UPI: ${pr.upiId}`;
  if (pr.bankName) return `Net Banking: ${pr.bankName}`;
  return null;
}

export default function OrderDetail() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const fromCheckout = location.state?.fromCheckout || false;

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getById(id)
      .then(r => { setOrder(r.data); setLoading(false); })
      .catch(() => navigate('/orders'));
  }, [id, user, navigate]);

  if (loading) return <Loader />;
  if (!order)  return null;

  const currentStep  = statusSteps.indexOf(order.orderStatus);
  const isCancelled  = order.orderStatus === 'Cancelled' || order.orderStatus === 'Returned';
  const pyLabel      = paymentLabel(order);

  return (
    <div>
      {/* ── Order Confirmed Banner ── */}
      {fromCheckout && (
        <div style={{ background: 'linear-gradient(135deg, #6c63ff, #c2185b)', padding: '20px 24px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 32 }}>🎉</span>
            <div style={{ color: 'white' }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>Order Confirmed!</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Thank you {user?.name?.split(' ')[0]}! Your order has been placed and is being processed.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/orders">My Orders</Link> / Order Details
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            <div>
              <h1 className="section-title gradient-text" style={{ marginBottom: 4 }}>
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <div style={{ color: '#636e72', fontSize: 14 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                {order.orderItems?.length > 0 && ` · ${order.orderItems.length} item${order.orderItems.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <span className={`badge badge-${statusColors[order.orderStatus]}`} style={{ fontSize: 14, padding: '10px 20px' }}>
              {statusIcons[order.orderStatus]} {order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>

        {/* ── Progress Tracker ── */}
        {!isCancelled && (
          <div style={{ background: 'white', borderRadius: 24, padding: 32, marginBottom: 24, boxShadow: '0 4px 20px rgba(108,99,255,0.1)', animation: 'fadeIn 0.5s ease' }}>
            <h3 style={{ marginBottom: 28, fontWeight: 700 }}>📦 Order Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {statusSteps.map((step, i) => (
                <React.Fragment key={step}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: i <= currentStep ? 'linear-gradient(135deg,#6c63ff,#fd79a8)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i <= currentStep ? 'white' : '#bdbdbd', fontSize: i < currentStep ? 20 : 22, fontWeight: 700, transition: 'all 0.5s', boxShadow: i <= currentStep ? '0 4px 14px rgba(108,99,255,0.35)' : 'none', zIndex: 1 }}>
                      {i < currentStep ? '✓' : ['📋', '⚙️', '🚚', '✅'][i]}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: i <= currentStep ? 700 : 400, color: i <= currentStep ? '#6c63ff' : '#9e9e9e', textAlign: 'center' }}>{step}</div>
                    {i === currentStep && (
                      <div style={{ fontSize: 10, color: '#c2185b', fontWeight: 600, marginTop: 2 }}>● Current</div>
                    )}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div style={{ flex: 1, height: 4, background: i < currentStep ? 'linear-gradient(90deg,#6c63ff,#fd79a8)' : '#f0f0f0', borderRadius: 2, transition: 'all 0.5s', marginBottom: 28 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
            {order.trackingNumber && (
              <div style={{ marginTop: 20, padding: '12px 18px', background: '#f0f4ff', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <div>
                  <div style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>TRACKING NUMBER</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6c63ff', fontSize: 15 }}>{order.trackingNumber}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="layout-order-detail">
          <div>
            {/* ── Ordered Items ── */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, marginBottom: 24, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>🛍️ Ordered Items</h3>
              {order.orderItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < order.orderItems.length - 1 ? '1px dashed #f0f0f0' : 'none', alignItems: 'center' }}>
                  <img src={item.image || ''} alt={item.name}
                    style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', background: '#fce4ec', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#9e9e9e' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#6c63ff' }}>₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* ── Delivery Address ── */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, marginBottom: 24, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📍 Delivery Address</h3>
              <div style={{ color: '#636e72', lineHeight: 2, fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: '#212121', fontSize: 15 }}>{user?.name}</div>
                <div>{order.shippingAddress?.street}</div>
                <div>{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                <div>PIN: {order.shippingAddress?.zip} · {order.shippingAddress?.country}</div>
              </div>
            </div>

            {/* ── Payment Details ── */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💳 Payment Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#9e9e9e' }}>Method</span>
                  <span style={{ fontWeight: 600 }}>{order.paymentMethod}</span>
                </div>
                {pyLabel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#9e9e9e' }}>Details</span>
                    <span style={{ fontWeight: 600, fontFamily: order.paymentResult?.cardLast4 ? 'monospace' : 'inherit' }}>{pyLabel}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#9e9e9e' }}>Payment Status</span>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: order.isPaid ? '#e8f5e9' : '#fff8e1', color: order.isPaid ? '#2e7d32' : '#f57f17' }}>
                    {order.isPaid ? '✓ Paid' : '⏳ Pay on Delivery'}
                  </span>
                </div>
                {order.isPaid && order.paidAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#9e9e9e' }}>Paid on</span>
                    <span style={{ fontWeight: 600 }}>{new Date(order.paidAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </div>
                )}
                {order.paymentResult?.id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#9e9e9e' }}>Transaction ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6c63ff' }}>{order.paymentResult.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div>
            {/* Price Summary */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 4px 20px rgba(108,99,255,0.1)', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>💰 Price Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString()}</span></div>
              <div className="summary-row"><span>Shipping</span><span style={{ color: order.shippingPrice === 0 ? '#00b894' : 'inherit' }}>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
              <div className="summary-row"><span>GST (18%)</span><span>₹{order.taxPrice?.toLocaleString()}</span></div>
              <div className="summary-total">
                <span>Total</span>
                <span className="gradient-text" style={{ fontSize: 22 }}>₹{order.totalPrice?.toLocaleString()}</span>
              </div>
              {order.isPaid && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#e8f5e9', borderRadius: 12, fontSize: 13, color: '#2e7d32', fontWeight: 600, textAlign: 'center' }}>
                  ✓ Payment received
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to={`/invoices/order/${id}`} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                🧾 View Invoice
              </Link>
              <Link to="/products" className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                🛍️ Continue Shopping
              </Link>
              <Link to="/orders" className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                ← Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
