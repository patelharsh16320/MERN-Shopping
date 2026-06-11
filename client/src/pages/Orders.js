import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled', Returned: 'cancelled' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getMyOrders().then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <h1 className="section-title gradient-text">📦 My Orders</h1>
          <p style={{ color: '#558b2f' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {/* Summary strip */}
        {orders.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { icon: '📦', label: 'Total Orders', value: orders.length },
              { icon: '⏳', label: 'Pending', value: orders.filter(o => o.orderStatus === 'Pending').length },
              { icon: '🚚', label: 'In Transit', value: orders.filter(o => ['Processing','Shipped'].includes(o.orderStatus)).length },
              { icon: '✅', label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length },
            ].map((stat, i) => (
              <div key={stat.label} className="card animate-fade" style={{ padding: '18px 16px', textAlign: 'center', animationDelay: `${i * 0.08}s` }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#757575' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state animate-zoom">
            <div className="empty-state-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
            <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>✨ Shop Now</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order, i) => (
              <div key={order._id} className="card animate-fade" style={{ padding: 0, animationDelay: `${i * 0.1}s`, cursor: 'pointer' }} onClick={() => navigate(`/orders/${order._id}`)}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#558b2f', marginBottom: 4 }}>Order ID</div>
                    <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>#{order._id.slice(-8).toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#558b2f', marginBottom: 4 }}>Date</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#558b2f', marginBottom: 4 }}>Items</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.orderItems?.reduce((s, i) => s + i.quantity, 0)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#558b2f', marginBottom: 4 }}>Total</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>₹{order.totalPrice?.toLocaleString()}</div>
                  </div>
                  <span className={`badge badge-${statusColors[order.orderStatus] || 'pending'}`} style={{ fontSize: 13, padding: '8px 16px' }}>
                    {order.orderStatus}
                  </span>
                </div>
                <div style={{ padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: -8 }}>
                    {order.orderItems?.slice(0, 3).map((item, j) => (
                      <img key={j} src={item.image || ''} alt={item.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', border: '2px solid white', marginLeft: j > 0 ? -12 : 0 }}
                        onError={e => e.target.style.display = 'none'} />
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{order.orderItems?.[0]?.name}{order.orderItems?.length > 1 ? ` + ${order.orderItems.length - 1} more` : ''}</div>
                    <div style={{ fontSize: 12, color: '#558b2f' }}>Payment: {order.paymentMethod} {order.isPaid ? '✅ Paid' : '⏳ Pending'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>View Details</Link>
                    <Link to={`/invoices/order/${order._id}`} className="btn btn-sm" style={{ background: '#e8f5e9', color: 'var(--primary)', borderRadius: 20 }} onClick={e => e.stopPropagation()}>🧾 Invoice</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
