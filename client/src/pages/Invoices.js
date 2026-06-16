import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import './Invoices.css';

/* ─── Invoice List ─────────────────────────────────────────────── */
export function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    invoiceAPI.getMyInvoices().then(r => { setInvoices(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <div className="breadcrumb"><Link to="/orders">My Orders</Link> / Invoices</div>
          <h1 className="section-title gradient-text inv-list-heading">🧾 My Invoices</h1>
          <p className="inv-list-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="container inv-page-body">
        {invoices.length === 0 ? (
          <div className="empty-state animate-zoom">
            <div className="empty-state-icon">🧾</div>
            <h3>No invoices yet</h3>
            <p>Your invoices will appear here after placing orders</p>
            <Link to="/products" className="btn btn-primary btn-lg inv-empty-cta">Shop Now</Link>
          </div>
        ) : (
          <div className="inv-list-wrap">
            {invoices.map((inv) => (
              <div key={inv._id} className="card animate-fade inv-row-card">
                <div className="inv-row-info">
                  <div className="inv-row-number">{inv.invoiceNumber}</div>
                  <div className="inv-row-date">{new Date(inv.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                </div>
                <div className="inv-row-items">{inv.items?.length} item{inv.items?.length !== 1 ? 's' : ''}</div>
                <div className="inv-row-total">₹{inv.total?.toLocaleString()}</div>
                <span className={`inv-badge inv-badge-${inv.status.toLowerCase()}`}>
                  {inv.status}
                </span>
                <div className="inv-row-actions">
                  <Link to={`/invoices/${inv._id}`} className="btn btn-primary btn-sm">View Invoice</Link>
                  {inv.order && <Link to={`/orders/${inv.order._id || inv.order}`} className="btn btn-secondary btn-sm">View Order</Link>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Invoice View (shared) ────────────────────────────────────── */
function paymentLine(invoice) {
  const pr = invoice.order?.paymentResult;
  if (!pr) return null;
  if (pr.cardLast4) return `**** **** **** ${pr.cardLast4}${pr.cardHolder ? ` · ${pr.cardHolder}` : ''}`;
  if (pr.upiId)    return `UPI: ${pr.upiId}`;
  if (pr.bankName) return `Net Banking · ${pr.bankName}`;
  return null;
}

function InvoiceView({ invoice }) {
  const navigate = useNavigate();
  if (!invoice) return null;

  const pLine = paymentLine(invoice);

  return (
    <div className="inv-view-page">
      {/* Actions — hidden on print */}
      <div className="container inv-actions-row">
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Download</button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* Invoice document */}
      <div className="container">
        <div className="inv-doc">

          {/* Header bar */}
          <div className="inv-doc-header">
            <div>
              <div className="inv-doc-brand">💗 Women HubClub</div>
              <div className="inv-doc-brand-address">
                123 Pink Street, Bandra West<br />
                Mumbai — 400050, Maharashtra<br />
                hello@womenhubclub.com · +91 99999 99999
              </div>
            </div>
            <div className="inv-doc-label-wrap">
              <div className="inv-doc-watermark">INVOICE</div>
              <div className="inv-doc-meta">
                <div className="inv-doc-number">{invoice.invoiceNumber}</div>
                <div>Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
                {invoice.dueDate && <div>Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>}
              </div>
              <div className={`inv-doc-status-badge inv-badge-${invoice.status.toLowerCase()}`}>
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Bill To + Payment Info */}
          <div className="inv-doc-grid">
            <div className="inv-doc-col-left">
              <div className="inv-doc-section-label">Bill To</div>
              <div className="inv-doc-bill-name">{invoice.billingAddress?.name}</div>
              <div className="inv-doc-bill-detail">
                {invoice.billingAddress?.email && <div>{invoice.billingAddress.email}</div>}
                {invoice.billingAddress?.phone && <div>{invoice.billingAddress.phone}</div>}
                {invoice.billingAddress?.street && <div>{invoice.billingAddress.street}</div>}
                {invoice.billingAddress?.city && <div>{invoice.billingAddress.city}, {invoice.billingAddress.state}</div>}
                {invoice.billingAddress?.zip && <div>PIN: {invoice.billingAddress.zip}, {invoice.billingAddress.country}</div>}
              </div>
            </div>
            <div className="inv-doc-col-right">
              <div className="inv-doc-section-label">Payment Info</div>
              <div className="inv-doc-payment-detail">
                <div><span className="inv-doc-payment-label">Method:</span> {invoice.paymentMethod}</div>
                {pLine && <div><span className="inv-doc-payment-label">Details:</span> <span className={invoice.order?.paymentResult?.cardLast4 ? 'inv-doc-mono' : ''}>{pLine}</span></div>}
                <div>
                  <span className="inv-doc-payment-label">Status: </span>
                  <span className={`inv-doc-pay-status ${invoice.order?.isPaid ? 'paid' : 'unpaid'}`}>
                    {invoice.order?.isPaid ? '✓ Paid' : '⏳ Pay on Delivery'}
                  </span>
                </div>
                {invoice.order?.paymentResult?.id && (
                  <div><span className="inv-doc-payment-label">TXN ID:</span> <span className="inv-doc-txn">{invoice.order.paymentResult.id}</span></div>
                )}
                {invoice.order?.orderStatus && (
                  <div><span className="inv-doc-payment-label">Order:</span> {invoice.order.orderStatus}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div>
            <table className="inv-doc-table">
              <thead>
                <tr className="inv-doc-thead-row">
                  {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} className={`inv-doc-th ${h === 'Product' || h === '#' ? 'left' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="inv-doc-tr">
                    <td className="inv-doc-td-idx">{i + 1}</td>
                    <td className="inv-doc-td-name">{item.name}</td>
                    <td className="inv-doc-td-center">{item.quantity}</td>
                    <td className="inv-doc-td-center">₹{item.price?.toLocaleString()}</td>
                    <td className="inv-doc-td-total">₹{item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="inv-doc-totals-wrap">
            <div className="inv-doc-totals-box">
              {[
                ['Subtotal',   `₹${invoice.subtotal?.toLocaleString()}`],
                ['Shipping',    invoice.shipping === 0 ? 'FREE' : `₹${invoice.shipping}`],
                ['GST (18%)',  `₹${invoice.tax?.toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="inv-doc-totals-row">
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div className="inv-doc-grand-row">
                <span>Total</span>
                <span className="inv-doc-grand-value">₹{invoice.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="inv-doc-footer">
            Thank you for shopping with <strong className="inv-doc-footer-brand">Women HubClub</strong>! 💗<br />
            Questions? Reach us at <strong>hello@womenhubclub.com</strong> or <strong>+91 99999 99999</strong><br />
            <span className="inv-doc-footer-small">Mon–Sun: 9 AM – 9 PM · 7-day easy returns</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail by invoice ID ─────────────────────────────────────── */
export function InvoiceDetail() {
  const { id }    = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    invoiceAPI.getById(id).then(r => { setInvoice(r.data); setLoading(false); }).catch(() => navigate('/invoices'));
  }, [id, user, navigate]);

  if (loading) return <Loader />;
  return <InvoiceView invoice={invoice} />;
}

/* ─── Detail by order ID ───────────────────────────────────────── */
export function InvoiceByOrder() {
  const { orderId }  = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner]   = useState(false);
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  useEffect(() => {
    if (location.state?.fromCheckout) setBanner(true);
  }, [location.state]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    invoiceAPI.getByOrder(orderId).then(r => { setInvoice(r.data); setLoading(false); }).catch(() => navigate('/invoices'));
  }, [orderId, user, navigate]);

  if (loading) return <Loader />;
  return (
    <>
      {banner && (
        <div className="inv-success-banner">
          <div className="inv-success-title">
            🎉 Order Placed Successfully!
          </div>
          <div className="inv-success-sub">
            Your invoice is ready below. You can print or download it anytime.
          </div>
          <button
            onClick={() => setBanner(false)}
            className="inv-success-close">
            ✕
          </button>
        </div>
      )}
      <InvoiceView invoice={invoice} />
    </>
  );
}
