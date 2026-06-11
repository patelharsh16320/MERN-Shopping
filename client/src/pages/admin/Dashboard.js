import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { orderAPI, userAPI, productAPI } from '../../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: {}, users: {}, products: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderAPI.getStats(),
      userAPI.getStats(),
      productAPI.getAll({ limit: 1 }),
      orderAPI.getAll({ limit: 5 })
    ]).then(([ord, usr, prd, orders]) => {
      setStats({ orders: ord.data, users: usr.data, products: prd.data.total });
      setRecentOrders(orders.data.orders);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Revenue', value: `₹${(stats.orders.revenue || 0).toLocaleString()}`, icon: '💰', gradient: 'linear-gradient(135deg,#6c63ff,#a29bfe)', bg: '#f0f0ff' },
    { label: 'Total Orders', value: stats.orders.total || 0, icon: '📦', gradient: 'linear-gradient(135deg,#fd79a8,#fab1d3)', bg: '#fff0f5' },
    { label: 'Total Users', value: stats.users.total || 0, icon: '👥', gradient: 'linear-gradient(135deg,#00cec9,#81ecec)', bg: '#e8ffff' },
    { label: 'Total Products', value: stats.products || 0, icon: '🌸', gradient: 'linear-gradient(135deg,#fdcb6e,#f9ca24)', bg: '#fffae0' },
    { label: 'Pending Orders', value: stats.orders.pending || 0, icon: '⏳', gradient: 'linear-gradient(135deg,#e17055,#fab1d3)', bg: '#fff5f0' },
    { label: 'Delivered', value: stats.orders.delivered || 0, icon: '✅', gradient: 'linear-gradient(135deg,#00b894,#55efc4)', bg: '#e8fff5' },
  ];

  const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          📊 <span className="gradient-text">Dashboard</span>
        </h1>
        <p style={{ color: '#636e72' }}>Welcome back! Here's what's happening with your store.</p>
      </div>

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
      <div className="table-container animate-fade">
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
    </AdminLayout>
  );
}
