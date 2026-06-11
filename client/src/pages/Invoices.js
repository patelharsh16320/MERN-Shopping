import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const statusColors = { Paid: 'delivered', Sent: 'processing', Overdue: 'cancelled', Cancelled: 'cancelled', Draft: 'pending' };
const statusBg     = { Paid: '#e8f5e9', Sent: '#e3f2fd', Overdue: '#ffebee', Cancelled: '#fafafa', Draft: '#fff8e1' };
const statusFg     = { Paid: '#2e7d32', Sent: '#1565c0', Overdue: '#c62828', Cancelled: '#757575', Draft: '#e65100' };

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
          <h1 className="section-title gradient-text" style={{ marginTop: 8 }}>🧾 My Invoices</h1>
          <p style={{ color: '#636e72' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {invoices.length === 0 ? (
          <div className="empty-state animate-zoom">
            <div className="empty-state-icon">🧾</div>
            <h3>No invoices yet</h3>
            <p>Your invoices will appear here after placing orders</p>
            <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>Shop Now</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {invoices.map((inv, i) => (
              <div key={inv._id} className="card animate-fade" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', animationDelay: `${i * 0.06}s` }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 13, color: '#9e9e9e', marginTop: 3 }}>{new Date(inv.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                </div>
                <div style={{ fontSize: 14, color: '#636e72', minWidth: 80 }}>{inv.items?.length} item{inv.items?.length !== 1 ? 's' : ''}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#212121', minWidth: 100 }}>₹{inv.total?.toLocaleString()}</div>
                <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusBg[inv.status] || '#f5f5f5', color: statusFg[inv.status] || '#757575' }}>
                  {inv.status}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
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
    <div style={{ background: '#f8f7ff', minHeight: '100vh', padding: '32px 24px' }}>
      {/* Actions — hidden on print */}
      <div className="container" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 24 }} id="invoice-actions">
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Download</button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* Invoice document */}
      <div className="container">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 40px rgba(108,99,255,0.12)', overflow: 'hidden', maxWidth: 820, margin: '0 auto' }} id="invoice-doc">

          {/* Header bar */}
          <div style={{ background: 'linear-gradient(135deg, #6c63ff, #c2185b)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>💗 Women HubClub</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6, lineHeight: 1.8 }}>
                123 Pink Street, Bandra West<br />
                Mumbai — 400050, Maharashtra<br />
                hello@womenhubclub.com · +91 99999 99999
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: 'rgba(255,255,255,0.15)', letterSpacing: 4, lineHeight: 1 }}>INVOICE</div>
              <div style={{ color: 'white', fontSize: 13, marginTop: 6, lineHeight: 1.8 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>{invoice.invoiceNumber}</div>
                <div>Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
                {invoice.dueDate && <div>Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>}
              </div>
              <div style={{ marginTop: 10, display: 'inline-block', padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusBg[invoice.status] || 'rgba(255,255,255,0.15)', color: statusFg[invoice.status] || 'white' }}>
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Bill To + Payment Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ padding: '24px 40px', borderRight: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#9e9e9e', marginBottom: 12 }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{invoice.billingAddress?.name}</div>
              <div style={{ fontSize: 13, color: '#636e72', lineHeight: 1.8 }}>
                {invoice.billingAddress?.email && <div>{invoice.billingAddress.email}</div>}
                {invoice.billingAddress?.phone && <div>{invoice.billingAddress.phone}</div>}
                {invoice.billingAddress?.street && <div>{invoice.billingAddress.street}</div>}
                {invoice.billingAddress?.city && <div>{invoice.billingAddress.city}, {invoice.billingAddress.state}</div>}
                {invoice.billingAddress?.zip && <div>PIN: {invoice.billingAddress.zip}, {invoice.billingAddress.country}</div>}
              </div>
            </div>
            <div style={{ padding: '24px 40px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#9e9e9e', marginBottom: 12 }}>Payment Info</div>
              <div style={{ fontSize: 13, color: '#636e72', lineHeight: 2 }}>
                <div><span style={{ fontWeight: 600, color: '#424242' }}>Method:</span> {invoice.paymentMethod}</div>
                {pLine && <div><span style={{ fontWeight: 600, color: '#424242' }}>Details:</span> <span style={{ fontFamily: invoice.order?.paymentResult?.cardLast4 ? 'monospace' : 'inherit' }}>{pLine}</span></div>}
                <div>
                  <span style={{ fontWeight: 600, color: '#424242' }}>Status: </span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: invoice.order?.isPaid ? '#e8f5e9' : '#fff8e1', color: invoice.order?.isPaid ? '#2e7d32' : '#e65100' }}>
                    {invoice.order?.isPaid ? '✓ Paid' : '⏳ Pay on Delivery'}
                  </span>
                </div>
                {invoice.order?.paymentResult?.id && (
                  <div><span style={{ fontWeight: 600, color: '#424242' }}>TXN ID:</span> <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6c63ff' }}>{invoice.order.paymentResult.id}</span></div>
                )}
                {invoice.order?.orderStatus && (
                  <div><span style={{ fontWeight: 600, color: '#424242' }}>Order:</span> {invoice.order.orderStatus}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ padding: '0 0 0 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f7ff' }}>
                  {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Product' || h === '#' ? 'left' : 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6c63ff', borderBottom: '2px solid #ede7f6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', color: '#bdbdbd', fontWeight: 600, fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>{item.name}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: '#636e72' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: '#636e72' }}>₹{item.price?.toLocaleString()}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#6c63ff' }}>₹{item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '28px 40px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ width: 300 }}>
              {[
                ['Subtotal',   `₹${invoice.subtotal?.toLocaleString()}`],
                ['Shipping',    invoice.shipping === 0 ? 'FREE' : `₹${invoice.shipping}`],
                ['GST (18%)',  `₹${invoice.tax?.toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed #ede7f6', fontSize: 14, color: '#636e72' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 22, fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ background: 'linear-gradient(135deg,#6c63ff,#c2185b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{invoice.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#f8f7ff', padding: '20px 40px', borderTop: '1px solid #ede7f6', textAlign: 'center', fontSize: 13, color: '#9e9e9e', lineHeight: 1.8 }}>
            Thank you for shopping with <strong style={{ color: 'var(--primary)' }}>Women HubClub</strong>! 💗<br />
            Questions? Reach us at <strong>hello@womenhubclub.com</strong> or <strong>+91 99999 99999</strong><br />
            <span style={{ fontSize: 12 }}>Mon–Sun: 9 AM – 9 PM · 7-day easy returns</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          #invoice-actions { display: none !important; }
          body { background: white; }
          #invoice-doc { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
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
  const { orderId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }    = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    invoiceAPI.getByOrder(orderId).then(r => { setInvoice(r.data); setLoading(false); }).catch(() => navigate('/invoices'));
  }, [orderId, user, navigate]);

  if (loading) return <Loader />;
  return <InvoiceView invoice={invoice} />;
}
