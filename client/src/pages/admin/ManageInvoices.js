import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { invoiceAPI } from '../../utils/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const statusColors = { Paid: 'paid', Sent: 'sent', Overdue: 'overdue', Cancelled: 'cancelled', Draft: 'draft' };
const statuses = ['Paid', 'Sent', 'Overdue', 'Cancelled', 'Draft'];

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

export default function ManageInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortField) return invoices;
    return [...invoices].sort((a, b) => {
      let aVal = getVal(a, sortField);
      let bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortField === 'items') { aVal = a.items?.length ?? 0; bVal = b.items?.length ?? 0; }
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [invoices, sortField, sortDir]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await invoiceAPI.getAll(params);
      setInvoices(data.invoices);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, [page, statusFilter]);

  const updateStatus = async (id, status) => {
    try { await invoiceAPI.update(id, { status }); toast.success('Invoice updated!'); fetchInvoices(); }
    catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try { await invoiceAPI.delete(id); toast.success('Invoice deleted!'); fetchInvoices(); }
    catch { toast.error('Delete failed'); }
  };

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🧾 <span className="gradient-text">Manage Invoices</span></h1>
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
              <th>Invoice #</th>
              <SortTh label="Customer" field="user.name" {...sortProps} />
              <SortTh label="Order" field="order._id" {...sortProps} />
              <SortTh label="Items" field="items" {...sortProps} />
              <SortTh label="Total" field="total" {...sortProps} />
              <SortTh label="Status" field="status" {...sortProps} />
              <SortTh label="Date" field="createdAt" {...sortProps} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : sortedInvoices.map(inv => (
              <tr key={inv._id}>
                <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6c63ff', fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.user?.name || 'N/A'}</div>
                  <div style={{ fontSize: 12, color: '#636e72' }}>{inv.user?.email}</div>
                </td>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{inv.order?._id?.slice(-6).toUpperCase()}</span></td>
                <td>{inv.items?.length}</td>
                <td style={{ fontWeight: 700, color: '#6c63ff' }}>₹{inv.total?.toLocaleString()}</td>
                <td>
                  <select value={inv.status} onChange={e => updateStatus(inv._id, e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: 12, color: '#6c63ff' }}>
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 13, color: '#636e72' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/invoices/${inv._id}`} className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }}>View</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(inv._id)}>Del</button>
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
    </AdminLayout>
  );
}
