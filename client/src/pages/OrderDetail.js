import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import './OrderDetail.css';

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
        <div className="od-confirm-banner">
          <div className="container od-confirm-inner">
            <span className="od-confirm-emoji">🎉</span>
            <div className="od-confirm-text">
              <div className="od-confirm-title">Order Confirmed!</div>
              <div className="od-confirm-sub">Thank you {user?.name?.split(' ')[0]}! Your order has been placed and is being processed.</div>
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
          <div className="od-header-row">
            <div>
              <h1 className="section-title gradient-text od-title">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <div className="od-meta">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                {order.orderItems?.length > 0 && ` · ${order.orderItems.length} item${order.orderItems.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <span className={`badge badge-${statusColors[order.orderStatus]} od-status-badge`}>
              {statusIcons[order.orderStatus]} {order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="container od-page-body">

        {/* ── Progress Tracker ── */}
        {!isCancelled && (
          <div className="od-progress-panel">
            <h3 className="od-progress-heading">📦 Order Progress</h3>
            <div className="od-progress-track">
              {statusSteps.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="od-step-wrap">
                    <div className={`od-step-circle ${i <= currentStep ? 'reached' : ''} ${i < currentStep ? 'checked' : ''}`}>
                      {i < currentStep ? '✓' : ['📋', '⚙️', '🚚', '✅'][i]}
                    </div>
                    <div className={`od-step-label ${i <= currentStep ? 'reached' : ''}`}>{step}</div>
                    {i === currentStep && (
                      <div className="od-step-current">● Current</div>
                    )}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`od-step-line ${i < currentStep ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            {order.trackingNumber && (
              <div className="od-tracking-box">
                <span className="od-tracking-icon">🔍</span>
                <div>
                  <div className="od-tracking-label">TRACKING NUMBER</div>
                  <div className="od-tracking-number">{order.trackingNumber}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="layout-order-detail">
          <div>
            {/* ── Ordered Items ── */}
            <div className="od-card">
              <h3 className="od-card-heading">🛍️ Ordered Items</h3>
              {order.orderItems?.map((item, i) => (
                <div key={i} className={`od-item-row ${i === order.orderItems.length - 1 ? 'no-border' : ''}`}>
                  <img src={item.image || ''} alt={item.name}
                    className="od-item-img"
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div className="od-item-info">
                    <div className="od-item-name">{item.name}</div>
                    <div className="od-item-meta">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
                  </div>
                  <div className="od-item-subtotal">₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* ── Delivery Address ── */}
            <div className="od-card">
              <h3 className="od-card-heading tight">📍 Delivery Address</h3>
              <div className="od-address-text">
                <div className="od-address-name">{user?.name}</div>
                <div>{order.shippingAddress?.street}</div>
                <div>{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                <div>PIN: {order.shippingAddress?.zip} · {order.shippingAddress?.country}</div>
              </div>
            </div>

            {/* ── Payment Details ── */}
            <div className="od-card last">
              <h3 className="od-card-heading tight">💳 Payment Details</h3>
              <div className="od-payment-rows">
                <div className="od-payment-row">
                  <span className="od-payment-label">Method</span>
                  <span className="od-payment-value">{order.paymentMethod}</span>
                </div>
                {pyLabel && (
                  <div className="od-payment-row">
                    <span className="od-payment-label">Details</span>
                    <span className={`od-payment-value ${order.paymentResult?.cardLast4 ? 'mono' : ''}`}>{pyLabel}</span>
                  </div>
                )}
                <div className="od-payment-row">
                  <span className="od-payment-label">Payment Status</span>
                  <span className={`od-payment-status-pill ${order.isPaid ? 'paid' : 'unpaid'}`}>
                    {order.isPaid ? '✓ Paid' : '⏳ Pay on Delivery'}
                  </span>
                </div>
                {order.isPaid && order.paidAt && (
                  <div className="od-payment-row">
                    <span className="od-payment-label">Paid on</span>
                    <span className="od-payment-value">{new Date(order.paidAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </div>
                )}
                {order.paymentResult?.id && (
                  <div className="od-payment-row">
                    <span className="od-payment-label">Transaction ID</span>
                    <span className="od-txn-id">{order.paymentResult.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div>
            {/* Price Summary */}
            <div className="od-card od-summary-card">
              <h3 className="od-card-heading">💰 Price Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString()}</span></div>
              <div className="summary-row"><span>Shipping</span><span className={order.shippingPrice === 0 ? 'od-free-text' : ''}>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
              <div className="summary-row"><span>GST (18%)</span><span>₹{order.taxPrice?.toLocaleString()}</span></div>
              <div className="summary-total">
                <span>Total</span>
                <span className="gradient-text od-total-amount">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
              {order.isPaid && (
                <div className="od-received-banner">
                  ✓ Payment received
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="od-actions-wrap">
              <Link to={`/invoices/order/${id}`} className="btn btn-primary od-action-btn">
                🧾 View Invoice
              </Link>
              <Link to="/products" className="btn btn-secondary od-action-btn">
                🛍️ Continue Shopping
              </Link>
              <Link to="/orders" className="btn btn-secondary od-action-btn">
                ← Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
