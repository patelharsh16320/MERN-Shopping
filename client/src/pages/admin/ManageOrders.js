import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { orderAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };

function SortTh({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}&nbsp;<span style={{ fontSize: 9, opacity: active ? 1 : 0.25 }}>{active && sortDir === 'desc' ? '▼' : '▲'}</span>
    </th>
  );
}

function getVal(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedOrders = useMemo(() => {
    if (!sortField) return orders;
    return [...orders].sort((a, b) => {
      let aVal = getVal(a, sortField);
      let bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortField === 'orderItems') { aVal = a.orderItems?.length ?? 0; bVal = b.orderItems?.length ?? 0; }
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [orders, sortField, sortDir]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await orderAPI.getAll(params);
      setOrders(data.orders);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await orderAPI.updateStatus(selectedOrder._id, { orderStatus: newStatus, isPaid: newStatus === 'Delivered' });
      toast.success('Order status updated!');
      setModal(false);
      fetchOrders();
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await orderAPI.delete(id); toast.success('Order deleted!'); fetchOrders(); }
    catch { toast.error('Delete failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>📦 <span className="gradient-text">Manage Orders</span></h1>
        <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>Total: {total}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...statuses].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <SortTh label="Customer" field="user.name" {...sortProps} />
              <SortTh label="Items" field="orderItems" {...sortProps} />
              <SortTh label="Total" field="totalPrice" {...sortProps} />
              <SortTh label="Payment" field="paymentMethod" {...sortProps} />
              <SortTh label="Status" field="orderStatus" {...sortProps} />
              <SortTh label="Date" field="createdAt" {...sortProps} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : sortedOrders.map(order => (
              <tr key={order._id}>
                <td><span style={{ fontFamily: 'monospace', color: '#6c63ff', fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{order.user?.name || 'N/A'}</div>
                  <div style={{ fontSize: 12, color: '#636e72' }}>{order.user?.email}</div>
                </td>
                <td>{order.orderItems?.length}</td>
                <td style={{ fontWeight: 700, color: '#6c63ff' }}>₹{order.totalPrice?.toLocaleString()}</td>
                <td>
                  <div style={{ fontSize: 13 }}>{order.paymentMethod}</div>
                  <span style={{ fontSize: 11, color: order.isPaid ? '#00b894' : '#d63031' }}>{order.isPaid ? '✅ Paid' : '⏳ Unpaid'}</span>
                </td>
                <td><span className={`badge badge-${statusColors[order.orderStatus]}`}>{order.orderStatus}</span></td>
                <td style={{ fontSize: 13, color: '#636e72' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }}
                      onClick={() => { setSelectedOrder(order); setNewStatus(order.orderStatus); setModal(true); }}>Update</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order._id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {modal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700 }}>📦 Update Order</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px', background: '#f8f7ff', borderRadius: 16, marginBottom: 20, fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>Order #{selectedOrder._id.slice(-8).toUpperCase()}</div>
              <div style={{ color: '#636e72' }}>Customer: {selectedOrder.user?.name}</div>
              <div style={{ color: '#636e72' }}>Total: ₹{selectedOrder.totalPrice?.toLocaleString()}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus}>💾 Update Status</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
