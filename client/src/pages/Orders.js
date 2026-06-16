import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import './Orders.css';

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
    <div className="pagination pagination-tight">
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="pagination-ellipsis">…</span>
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
    <th onClick={() => toggleSort(field)} className="sort-th">
      {label}&nbsp;
      <span className={`sort-th-arrow ${sortField === field ? 'active' : ''}`}>
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
          <button className="btn btn-secondary btn-sm ord-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="section-title gradient-text">📦 My Orders</h1>
          <p className="ord-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
      </div>

      <div className="container ord-page-body">
        {/* Summary strip */}
        {orders.length > 0 && (
          <div className="ord-stats-grid">
            {[
              { icon: '📦', label: 'Total Orders', value: orders.length },
              { icon: '⏳', label: 'Pending', value: orders.filter(o => o.orderStatus === 'Pending').length },
              { icon: '🚚', label: 'In Transit', value: orders.filter(o => ['Processing', 'Shipped'].includes(o.orderStatus)).length },
              { icon: '✅', label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length },
            ].map((stat) => (
              <div key={stat.label} className="card animate-fade ord-stat-card">
                <div className="ord-stat-icon">{stat.icon}</div>
                <div className="ord-stat-value">{stat.value}</div>
                <div className="ord-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state animate-zoom">
            <div className="empty-state-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
            <Link to="/products" className="btn btn-primary btn-lg ord-empty-cta">✨ Shop Now</Link>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="ord-toolbar">
              <div className="ord-toolbar-row">
                <input className="form-input ord-search-input" placeholder="Search orders..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <div className="ord-status-filters">
                  {['', ...statuses].map(s => (
                    <button key={s} className={`btn btn-sm ord-status-filter-btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => { setStatusFilter(s); setPage(1); }}>
                      {s || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ord-cols-row">
                <span className="ord-cols-label">Columns:</span>
                {ORDER_COLS.map(col => (
                  <button key={col} onClick={() => toggleCol(col)}
                    className={`ord-col-btn ${visibleCols[col] ? 'active' : ''}`}>
                    {visibleCols[col] ? '✓ ' : ''}{col}
                  </button>
                ))}
                <span className="ord-count-text">
                  {filtered.length !== orders.length ? `${filtered.length} / ${orders.length}` : `${orders.length}`} orders
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="table-container animate-fade ord-table-wrap">
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
                    <tr><td colSpan={3 + Object.values(visibleCols).filter(Boolean).length} className="ord-empty-row">No orders found.</td></tr>
                  ) : paginated.map((order, i) => (
                    <tr key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="ord-row">
                      <td className="ord-idx-cell">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div className="ord-id-text">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      {visibleCols['Items'] && (
                        <td>
                          <div className="ord-items-cell">
                            <div className="ord-items-thumbs">
                              {order.orderItems?.slice(0, 2).map((item, j) => (
                                <img key={j} src={item.image || ''} alt={item.name}
                                  className={`ord-item-thumb ${j > 0 ? 'overlap' : ''}`}
                                  onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                            <span className="ord-items-name">
                              {order.orderItems?.[0]?.name?.slice(0, 16)}{order.orderItems?.length > 1 ? ` +${order.orderItems.length - 1}` : ''}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleCols['Total'] && (
                        <td className="ord-total-cell">₹{order.totalPrice?.toLocaleString()}</td>
                      )}
                      {visibleCols['Payment'] && (
                        <td>
                          <div className="ord-payment-method">{order.paymentMethod}</div>
                          <div className={`ord-payment-status ${order.isPaid ? 'paid' : 'unpaid'}`}>
                            {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                          </div>
                        </td>
                      )}
                      {visibleCols['Status'] && (
                        <td><span className={`badge badge-${statusColors[order.orderStatus] || 'pending'}`}>{order.orderStatus}</span></td>
                      )}
                      {visibleCols['Date'] && (
                        <td className="ord-date-cell">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      )}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="ord-actions-cell">
                          <Link to={`/orders/${order._id}`} className="btn btn-sm ord-view-link">View</Link>
                          <Link to={`/invoices/order/${order._id}`} className="btn btn-sm ord-invoice-link">🧾</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ord-footer-row">
              <span className="ord-showing-text">
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
