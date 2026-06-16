import React, { useRef, useState } from 'react';
import AdminLayout from './AdminLayout';
import './PageSpeed.css';

const PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Cart', path: '/cart' },
  { label: 'Checkout', path: '/checkout' },
  { label: 'Login', path: '/login' },
  { label: 'Register', path: '/register' },
  { label: 'My Orders', path: '/orders' },
  { label: 'Wishlist', path: '/wishlist' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Refund Policy', path: '/refund' },
  { label: 'Beauty Quiz', path: '/quiz' },
  { label: 'Terms & Conditions', path: '/terms' },
  { label: 'Support', path: '/support' },
  { label: 'Special Offers', path: '/offers' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Profile', path: '/profile' },
];

const TIMEOUT_MS = 15000;

function speedStatus(ms) {
  if (ms < 800) return 'fast';
  if (ms < 2000) return 'ok';
  return 'slow';
}

function loadTiming(path, viewportClass) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.className = `pagespeed-probe-frame ${viewportClass}`;

    let settled = false;
    const finish = (ms) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      iframe.remove();
      resolve(ms);
    };

    const timer = setTimeout(() => finish(null), TIMEOUT_MS);
    const start = performance.now();

    iframe.addEventListener('load', () => finish(performance.now() - start));
    iframe.addEventListener('error', () => finish(null));

    document.body.appendChild(iframe);
    iframe.src = path;
  });
}

export default function PageSpeed() {
  const [results, setResults] = useState(() => PAGES.map(p => ({ ...p, desktop: undefined, mobile: undefined })));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  const runCheck = async () => {
    setRunning(true);
    cancelRef.current = false;
    setResults(PAGES.map(p => ({ ...p, desktop: undefined, mobile: undefined })));
    setProgress(0);

    for (let i = 0; i < PAGES.length; i++) {
      if (cancelRef.current) break;
      const page = PAGES[i];

      const desktopMs = await loadTiming(page.path, 'pagespeed-frame-desktop');
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, desktop: desktopMs } : r));
      if (cancelRef.current) break;

      const mobileMs = await loadTiming(page.path, 'pagespeed-frame-mobile');
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, mobile: mobileMs } : r));

      setProgress(i + 1);
    }

    setRunning(false);
  };

  const stopCheck = () => { cancelRef.current = true; };

  const fmt = (ms) => {
    if (ms === undefined) return running ? '…' : '—';
    if (ms === null) return 'Failed';
    return `${Math.round(ms)} ms`;
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>⚡ <span className="gradient-text">Page Speed Check</span></h1>
        <div className="pagespeed-actions">
          {running && <button className="btn btn-secondary" onClick={stopCheck}>■ Stop</button>}
          <button className="btn btn-primary" onClick={runCheck} disabled={running}>
            {running ? `⏳ Running... (${progress}/${PAGES.length})` : '▶ Run Speed Check'}
          </button>
        </div>
      </div>

      <p className="pagespeed-note">
        Loads every customer-facing page in the background — once at a desktop width (1280px) and once at a
        phone width (390px) — and times how long each takes to fire its load event. This approximates real
        page load time but doesn't throttle network/CPU like a real mobile device would. For full Core Web
        Vitals (FCP, LCP, TTI) with proper throttling, a Lighthouse-based audit would be needed instead.
      </p>

      <div className="table-container animate-fade">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Desktop</th>
              <th>Mobile</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              const bothAttempted = r.desktop !== undefined && r.mobile !== undefined;
              const validValues = [r.desktop, r.mobile].filter(v => typeof v === 'number');
              const status = !bothAttempted ? null : validValues.length > 0 ? speedStatus(Math.max(...validValues)) : 'failed';
              const statusLabel = { fast: '🟢 Fast', ok: '🟡 OK', slow: '🔴 Slow', failed: '⚪ Failed' }[status];

              return (
                <tr key={r.path}>
                  <td className="pagespeed-page-cell">
                    <div className="pagespeed-page-label">{r.label}</div>
                    <div className="pagespeed-page-path">{r.path}</div>
                  </td>
                  <td>{fmt(r.desktop)}</td>
                  <td>{fmt(r.mobile)}</td>
                  <td>
                    {status && (
                      <span className={`pagespeed-badge pagespeed-badge-${status}`}>{statusLabel}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
