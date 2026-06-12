import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled', Returned: 'cancelled' };
const ORDER_COLS = ['Items', 'Total', 'Payment', 'Status', 'Date'];
const PAGE_SIZE = 10;

function Paginator({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i <= 2 || i > totalPages - 2 || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div className="pagination" style={{ marginTop: 16 }}>
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 6px', color: '#9e9e9e', alignSelf: 'center' }}>…</span>
          : <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user_orders_cols') || '{}');
      return Object.fromEntries(ORDER_COLS.map(c => [c, saved[c] !== undefined ? saved[c] : true]));
    } catch { return Object.fromEntries(ORDER_COLS.map(c => [c, true])); }
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getMyOrders().then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user, navigate]);

  const toggleCol = (col) => setVisibleCols(v => {
    const next = { ...v, [col]: !v[col] };
    localStorage.setItem('user_orders_cols', JSON.stringify(next));
    return next;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter) list = list.filter(o => o.orderStatus === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o._id.toLowerCase().includes(q) || o.orderItems?.some(i => i.name?.toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => {
      let av = sortField === 'totalPrice' ? a.totalPrice : sortField === 'createdAt' ? new Date(a.createdAt) : a[sortField] ?? '';
      let bv = sortField === 'totalPrice' ? b.totalPrice : sortField === 'createdAt' ? new Date(b.createdAt) : b[sortField] ?? '';
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [orders, statusFilter, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortTh = ({ field, label }) => (
    <th onClick={() => toggleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}&nbsp;
      <span style={{ fontSize: 9, opacity: sortField === field ? 1 : 0.25 }}>
        {sortField === field && sortDir === 'desc' ? '▼' : '▲'}
      </span>
    </th>
  );

  if (loading) return <Loader />;

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { icon: '📦', label: 'Total Orders', value: orders.length },
              { icon: '⏳', label: 'Pending', value: orders.filter(o => o.orderStatus === 'Pending').length },
              { icon: '🚚', label: 'In Transit', value: orders.filter(o => ['Processing', 'Shipped'].includes(o.orderStatus)).length },
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
          <>
            {/* Toolbar */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <input className="form-input" placeholder="Search orders..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ maxWidth: 240, padding: '8px 14px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['', ...statuses].map(s => (
                    <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => { setStatusFilter(s); setPage(1); }} style={{ fontSize: 12 }}>
                      {s || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600 }}>Columns:</span>
                {ORDER_COLS.map(col => (
                  <button key={col} onClick={() => toggleCol(col)}
                    style={{ padding: '3px 12px', borderRadius: 20, border: `2px solid ${visibleCols[col] ? '#6c63ff' : '#e0e0e0'}`, background: visibleCols[col] ? '#f0f0ff' : 'white', color: visibleCols[col] ? '#6c63ff' : '#9e9e9e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {visibleCols[col] ? '✓ ' : ''}{col}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9e9e9e' }}>
                  {filtered.length !== orders.length ? `${filtered.length} / ${orders.length}` : `${orders.length}`} orders
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="table-container animate-fade" style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <SortTh field="_id" label="Order ID" />
                    {visibleCols['Items'] && <th>Items</th>}
                    {visibleCols['Total'] && <SortTh field="totalPrice" label="Total" />}
                    {visibleCols['Payment'] && <th>Payment</th>}
                    {visibleCols['Status'] && <SortTh field="orderStatus" label="Status" />}
                    {visibleCols['Date'] && <SortTh field="createdAt" label="Date" />}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={3 + Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No orders found.</td></tr>
                  ) : paginated.map((order, i) => (
                    <tr key={order._id} onClick={() => navigate(`/orders/${order._id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: '#6c63ff' }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      {visibleCols['Items'] && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex' }}>
                              {order.orderItems?.slice(0, 2).map((item, j) => (
                                <img key={j} src={item.image || ''} alt={item.name}
                                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '2px solid white', marginLeft: j > 0 ? -8 : 0 }}
                                  onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                            <span style={{ fontSize: 13, color: '#636e72' }}>
                              {order.orderItems?.[0]?.name?.slice(0, 16)}{order.orderItems?.length > 1 ? ` +${order.orderItems.length - 1}` : ''}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleCols['Total'] && (
                        <td style={{ fontWeight: 700, color: '#6c63ff' }}>₹{order.totalPrice?.toLocaleString()}</td>
                      )}
                      {visibleCols['Payment'] && (
                        <td>
                          <div style={{ fontSize: 13 }}>{order.paymentMethod}</div>
                          <div style={{ fontSize: 11, color: order.isPaid ? '#00b894' : '#d63031' }}>
                            {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                          </div>
                        </td>
                      )}
                      {visibleCols['Status'] && (
                        <td><span className={`badge badge-${statusColors[order.orderStatus] || 'pending'}`}>{order.orderStatus}</span></td>
                      )}
                      {visibleCols['Date'] && (
                        <td style={{ fontSize: 13, color: '#636e72', whiteSpace: 'nowrap' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      )}
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/orders/${order._id}`} className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20, fontSize: 12 }}>View</Link>
                          <Link to={`/invoices/order/${order._id}`} className="btn btn-sm" style={{ background: '#e8f5e9', color: 'var(--primary)', borderRadius: 20, fontSize: 12 }}>🧾</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#9e9e9e' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <Paginator page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
