import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { orderAPI } from '../../utils/api';
import { toast } from 'react-toastify';

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
  const [newStatus, setNewStatus] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportingXlsx, setExportingXlsx] = useState(false);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ limit: 10000 });
      setOrders(data.orders);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setNotes(order.privateNotes || []);
    setNoteText('');
    setModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await orderAPI.updateStatus(selectedOrder._id, { orderStatus: newStatus, isPaid: newStatus === 'Delivered' });
      toast.success('Order status updated!');
      setModal(false);
      fetchOrders();
    } catch { toast.error('Update failed'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const { data } = await orderAPI.addNote(selectedOrder._id, noteText.trim());
      setNotes(data);
      setNoteText('');
      // update in local orders list too
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, privateNotes: data } : o));
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    setSavingNote(false);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const { data } = await orderAPI.deleteNote(selectedOrder._id, noteId);
      setNotes(data);
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, privateNotes: data } : o));
    } catch { toast.error('Failed to delete note'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await orderAPI.delete(id); toast.success('Order deleted!'); fetchOrders(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExportXlsx = async () => {
    setExportingXlsx(true);
    try {
      const response = await orderAPI.exportXlsx();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded!');
    } catch { toast.error('Export failed'); }
    setExportingXlsx(false);
  };

  const toggleSelect = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const ids = paginated.map(o => o._id);
    const allOn = ids.length > 0 && ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} order(s)? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map(id => orderAPI.delete(id)));
      toast.success(`${selectedIds.size} order(s) deleted`);
      setSelectedIds(new Set()); fetchOrders();
    } catch { toast.error('Some deletions failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>📦 <span className="gradient-text">Manage Orders</span></h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {statusFilter ? `${sortedOrders.length} / ${orders.length}` : orders.length} orders
          </div>
          <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 20, fontWeight: 600 }}
            onClick={handleExportXlsx} disabled={exportingXlsx}>
            {exportingXlsx ? '⏳...' : '📊 Export Excel'}
          </button>
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

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fff0f0', borderRadius: 12, marginBottom: 14, border: '2px solid #ffcccc', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828' }}>{selectedIds.size} selected</span>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>🗑 Delete Selected</button>
          <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setSelectedIds(new Set())}>✕ Deselect All</button>
        </div>
      )}

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={paginated.length > 0 && paginated.every(o => selectedIds.has(o._id))}
                  onChange={toggleSelectAll} />
              </th>
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
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No orders found.</td></tr>
            ) : paginated.map((order, i) => (
              <tr key={order._id}>
                <td><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
                  checked={selectedIds.has(order._id)} onChange={() => toggleSelect(order._id)} /></td>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td>
                  <span style={{ fontFamily: 'monospace', color: '#6c63ff', fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</span>
                  {order.privateNotes?.length > 0 && (
                    <span title={`${order.privateNotes.length} private note(s)`} style={{ marginLeft: 6, fontSize: 11, background: '#fff8e1', color: '#e65100', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                      📝 {order.privateNotes.length}
                    </span>
                  )}
                </td>
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
                      onClick={() => openModal(order)}>Update</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order._id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {modal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 580, animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700 }}>📦 Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Order summary */}
            <div style={{ padding: '14px 16px', background: '#f8f7ff', borderRadius: 14, marginBottom: 20, fontSize: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: '#9e9e9e' }}>Customer:</span> <strong>{selectedOrder.user?.name}</strong></div>
              <div><span style={{ color: '#9e9e9e' }}>Email:</span> {selectedOrder.user?.email}</div>
              <div><span style={{ color: '#9e9e9e' }}>Total:</span> <strong style={{ color: '#6c63ff' }}>₹{selectedOrder.totalPrice?.toLocaleString()}</strong></div>
              <div><span style={{ color: '#9e9e9e' }}>Payment:</span> {selectedOrder.paymentMethod}</div>
            </div>

            {/* Status update */}
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleUpdateStatus} style={{ marginBottom: 24 }}>💾 Update Status</button>

            {/* Private Notes */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                📝 Private Notes
                <span style={{ fontSize: 12, fontWeight: 400, color: '#9e9e9e' }}>visible to admin only</span>
              </div>

              {notes.length === 0 && (
                <div style={{ color: '#9e9e9e', fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>No notes yet.</div>
              )}

              {notes.map(note => (
                <div key={note._id} style={{ background: '#fffbf0', border: '1px solid #ffe0b2', borderRadius: 12, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: '#424242', lineHeight: 1.5 }}>{note.text}</div>
                    <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 4 }}>
                      {note.addedBy} · {new Date(note.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteNote(note._id)}
                    style={{ background: 'none', border: 'none', color: '#d63031', cursor: 'pointer', fontSize: 16, padding: '2px 4px', flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="form-input" placeholder="Add a private note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddNote()}
                  style={{ flex: 1, fontSize: 14 }} />
                <button className="btn btn-primary" onClick={handleAddNote} disabled={savingNote || !noteText.trim()} style={{ whiteSpace: 'nowrap' }}>
                  {savingNote ? '⏳' : '+ Add'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
