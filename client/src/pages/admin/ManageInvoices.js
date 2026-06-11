import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { invoiceAPI } from '../../utils/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImportModal from './ImportModal';

const statusColors = { Paid: 'paid', Sent: 'sent', Overdue: 'overdue', Cancelled: 'cancelled', Draft: 'draft' };
const statuses = ['Paid', 'Sent', 'Overdue', 'Cancelled', 'Draft'];
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

export default function ManageInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [importModal, setImportModal] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filteredInvoices = useMemo(() => {
    if (!statusFilter) return invoices;
    return invoices.filter(inv => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const sortedInvoices = useMemo(() => {
    if (!sortField) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aVal = getVal(a, sortField);
      let bVal = getVal(b, sortField);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortField === 'items') { aVal = a.items?.length ?? 0; bVal = b.items?.length ?? 0; }
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredInvoices, sortField, sortDir]);

  const totalPages = Math.ceil(sortedInvoices.length / PAGE_SIZE);
  const paginated = sortedInvoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = async (format) => {
    try {
      const { data } = await invoiceAPI.exportAll(format);
      const isCSV = format === 'csv';
      const blob = new Blob([isCSV ? data : JSON.stringify(data, null, 2)], { type: isCSV ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoices-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${isCSV ? '' : data.length + ' '}invoices as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (items, duplicateAction) => {
    const { data } = await invoiceAPI.importAll(items, duplicateAction);
    fetchInvoices();
    return data;
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.getAll({ limit: 10000 });
      setInvoices(data.invoices);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>
            {statusFilter ? `${sortedInvoices.length} / ${invoices.length}` : invoices.length} invoices
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
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#636e72' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9e9e9e' }}>No invoices found.</td></tr>
            ) : paginated.map((inv, i) => (
              <tr key={inv._id}>
                <td style={{ color: '#636e72' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
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

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {importModal && (
        <ImportModal entityName="Invoices" onImport={handleImport} onClose={() => setImportModal(false)} />
      )}
    </AdminLayout>
  );
}
