import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { orderAPI, userAPI, productAPI, contactAPI, subscriberAPI, dashboardWidgetAPI } from '../../utils/api';
import { Link } from 'react-router-dom';
import { getSocket } from '../../utils/socket';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: {}, users: {}, products: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState(null);
  const [lowStock, setLowStock] = useState({ lowStock: [], outOfStock: [] });

  useEffect(() => {
    productAPI.getLowStock(5).then(({ data }) => setLowStock(data)).catch(() => {});
    Promise.all([
      orderAPI.getStats(),
      userAPI.getStats(),
      productAPI.getAll({ limit: 1 }),
      orderAPI.getAll({ limit: 5 }),
      contactAPI.getAll({ limit: 5 }),
      subscriberAPI.getAll(),
    ]).then(([ord, usr, prd, orders, msgs, subs]) => {
      setStats({ orders: ord.data, users: usr.data, products: prd.data.total });
      setRecentOrders(orders.data.orders);
      setContacts(msgs.data.contacts || []);
      setSubscribers(subs.data.subscribers || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    dashboardWidgetAPI.getAll()
      .then(({ data }) => setWidgets(Object.fromEntries(data.map(w => [w.key, w.isActive]))))
      .catch(() => setWidgets({}));
  }, []);

  const showWidget = (key) => widgets === null || widgets[key] !== false;

  // Live socket updates — no page refresh needed
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewOrder = (data) => {
      setStats(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          total:   (prev.orders.total   || 0) + 1,
          revenue: (prev.orders.revenue || 0) + (data.totalPrice || 0),
          pending: (prev.orders.pending || 0) + 1,
        }
      }));
      setRecentOrders(prev => [
        {
          _id: data.orderId, orderStatus: 'Pending',
          totalPrice: data.totalPrice,
          user: { name: data.userName },
          createdAt: data.createdAt,
        },
        ...prev.slice(0, 4),
      ]);
    };

    const onNewUser = () => {
      setStats(prev => ({
        ...prev,
        users: { ...prev.users, total: (prev.users.total || 0) + 1, active: (prev.users.active || 0) + 1 }
      }));
    };

    const onProductsUpdated = () => {
      productAPI.getAll({ limit: 1 }).then(({ data }) => {
        setStats(prev => ({ ...prev, products: data.total }));
      }).catch(() => {});
    };

    socket.on('new_order',        onNewOrder);
    socket.on('new_user',         onNewUser);
    socket.on('products_updated', onProductsUpdated);

    return () => {
      socket.off('new_order',        onNewOrder);
      socket.off('new_user',         onNewUser);
      socket.off('products_updated', onProductsUpdated);
    };
  }, []);

  const cards = [
    { key: 'revenueCard', label: 'Total Revenue', value: `₹${(stats.orders.revenue || 0).toLocaleString()}`, icon: '💰', gradient: 'linear-gradient(135deg,#6c63ff,#a29bfe)', bg: '#f0f0ff' },
    { key: 'ordersCard', label: 'Total Orders', value: stats.orders.total || 0, icon: '📦', gradient: 'linear-gradient(135deg,#fd79a8,#fab1d3)', bg: '#fff0f5' },
    { key: 'usersCard', label: 'Total Users', value: stats.users.total || 0, icon: '👥', gradient: 'linear-gradient(135deg,#00cec9,#81ecec)', bg: '#e8ffff' },
    { key: 'productsCard', label: 'Total Products', value: stats.products || 0, icon: '🌸', gradient: 'linear-gradient(135deg,#fdcb6e,#f9ca24)', bg: '#fffae0' },
    { key: 'pendingCard', label: 'Pending Orders', value: stats.orders.pending || 0, icon: '⏳', gradient: 'linear-gradient(135deg,#e17055,#fab1d3)', bg: '#fff5f0' },
    { key: 'deliveredCard', label: 'Delivered', value: stats.orders.delivered || 0, icon: '✅', gradient: 'linear-gradient(135deg,#00b894,#55efc4)', bg: '#e8fff5' },
  ].filter(card => showWidget(card.key));

  const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          📊 <span className="gradient-text">Dashboard</span>
        </h1>
        <p style={{ color: '#636e72' }}>Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Low stock alert banner */}
      {(lowStock.outOfStock.length > 0 || lowStock.lowStock.length > 0) && (
        <div style={{ background: '#fff8f0', border: '2px solid #ffe0b2', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#e65100', marginBottom: 4 }}>Stock Alert</div>
            {lowStock.outOfStock.length > 0 && (
              <div style={{ fontSize: 13, color: '#d32f2f', marginBottom: 4 }}>
                <strong>{lowStock.outOfStock.length} product{lowStock.outOfStock.length > 1 ? 's' : ''} out of stock:</strong>{' '}
                {lowStock.outOfStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.outOfStock.length > 3 ? ` +${lowStock.outOfStock.length - 3} more` : ''}
              </div>
            )}
            {lowStock.lowStock.length > 0 && (
              <div style={{ fontSize: 13, color: '#e65100' }}>
                <strong>{lowStock.lowStock.length} product{lowStock.lowStock.length > 1 ? 's' : ''} running low:</strong>{' '}
                {lowStock.lowStock.slice(0, 3).map(p => `${p.name} (${p.stock} left)`).join(', ')}{lowStock.lowStock.length > 3 ? ` +${lowStock.lowStock.length - 3} more` : ''}
              </div>
            )}
          </div>
          <Link to="/admin/products" style={{ color: '#e65100', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>View Products →</Link>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        {cards.map((card, i) => (
          <div key={card.label} className="stat-card" style={{ animationDelay: `${i * 0.1}s`, background: 'white' }}>
            <div className="stat-icon" style={{ background: card.bg }}>
              <span>{card.icon}</span>
            </div>
            <div className="stat-number" style={{ background: card.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      {showWidget('recentOrders') && (
      <div className="table-container animate-fade" style={{ marginBottom: 32 }}>
        <div className="table-header">
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>Recent Orders</h3>
          <a href="/admin/orders" style={{ color: '#6c63ff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>View All →</a>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#636e72' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id}>
                  <td><span style={{ fontFamily: 'monospace', color: '#6c63ff', fontWeight: 600 }}>#{order._id.slice(-6).toUpperCase()}</span></td>
                  <td>{order.user?.name || 'N/A'}</td>
                  <td>{order.orderItems?.length}</td>
                  <td style={{ fontWeight: 700 }}>₹{order.totalPrice?.toLocaleString()}</td>
                  <td><span className={`badge badge-${statusColors[order.orderStatus] || 'pending'}`}>{order.orderStatus}</span></td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Messages section */}
      {(showWidget('contactMessages') || showWidget('subscribers')) && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>

        {/* Contact form messages */}
        {showWidget('contactMessages') && (
        <div className="table-container animate-fade">
          <div className="table-header">
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>📩 Contact Messages</h3>
            <a href="/admin/contacts" style={{ color: '#6c63ff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>View All →</a>
          </div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#636e72' }}>Loading...</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#bdbdbd' }}>No messages yet.</div>
          ) : (
            <div>
              {contacts.map(c => (
                <div key={c._id} style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #f5f5f5',
                  background: c.isRead ? 'white' : '#fff8fb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!c.isRead && (
                        <span style={{ background: '#c2185b', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>NEW</span>
                      )}
                      <span style={{ fontSize: 11, color: '#9e9e9e' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#c2185b', fontWeight: 600 }}>{c.email}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{c.subject}</div>
                  <div style={{ fontSize: 12, color: '#757575', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {c.message}
                  </div>
                  {c.replies?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#00b894', fontWeight: 600, marginTop: 2 }}>
                      ✓ {c.replies.length} repl{c.replies.length === 1 ? 'y' : 'ies'} sent
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Newsletter subscribers */}
        {showWidget('subscribers') && (
        <div className="table-container animate-fade">
          <div className="table-header">
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>💌 Inner Circle Subscribers</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#c2185b' }}>
                {subscribers.length} member{subscribers.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={async () => {
                  try {
                    const res = await subscriberAPI.export();
                    const url = URL.createObjectURL(res.data);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'newsletter_subscribers.xlsx';
                    a.click(); URL.revokeObjectURL(url);
                  } catch { alert('Export failed'); }
                }}
                style={{ padding: '6px 14px', borderRadius: 20, border: '2px solid #00b894', background: '#f0fdf4', color: '#00b894', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ⬇ Export Excel
              </button>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#636e72' }}>Loading...</div>
          ) : subscribers.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#bdbdbd' }}>No subscribers yet.</div>
          ) : (
            <div>
              {subscribers.map((s, i) => (
                <div key={s._id} style={{
                  padding: '11px 18px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c2185b, #e91e63)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0,
                    }}>
                      {s.email[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333', wordBreak: 'break-all' }}>{s.email}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#9e9e9e', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
      )}
    </AdminLayout>
  );
}
