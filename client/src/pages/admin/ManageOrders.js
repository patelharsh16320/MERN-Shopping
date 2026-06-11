import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { orderAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import ImportModal from './ImportModal';

const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const statusColors = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };
const PAGE_SIZE = 10;

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

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter(o => o.orderStatus === statusFilter);
  }, [orders, statusFilter]);

  const sortedOrders = useMemo(() => {
    if (!sortField) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let aVal = getVal(a, sortField);
      let bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortField === 'orderItems') { aVal = a.orderItems?.length ?? 0; bVal = b.orderItems?.length ?? 0; }
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredOrders, sortField, sortDir]);

  const totalPages = Math.ceil(sortedOrders.length / PAGE_SIZE);
  const paginated = sortedOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = async (format) => {
    try {
      const { data } = await orderAPI.exportAll(format);
      const isCSV = format === 'csv';
      const blob = new Blob([isCSV ? data : JSON.stringify(data, null, 2)], { type: isCSV ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${isCSV ? '' : data.length + ' '}orders as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (items, duplicateAction) => {
    const { data } = await orderAPI.importAll(items, duplicateAction);
    fetchOrders();
    return data;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ limit: 10000 });
      setOrders(data.orders);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {statusFilter ? `${sortedOrders.length} / ${orders.length}` : orders.length} orders
          </div>
          <button className="btn btn-secondary" onClick={() => handleExport('json')} style={{ fontWeight: 600 }}>📤 JSON</button>
          <button className="btn btn-secondary" onClick={() => handleExport('csv')} style={{ fontWeight: 600 }}>📤 CSV</button>
          <button className="btn btn-secondary" onClick={() => setImportModal(true)} style={{ fontWeight: 600 }}>📥 Import</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...statuses].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th>#</th>
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
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No orders found.</td></tr>
            ) : paginated.map((order, i) => (
              <tr key={order._id}>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
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

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {importModal && (
        <ImportModal entityName="Orders" onImport={handleImport} onClose={() => setImportModal(false)} />
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
