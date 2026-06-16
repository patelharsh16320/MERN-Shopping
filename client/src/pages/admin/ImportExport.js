import React, { useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { dataAPI } from '../../utils/api';
import { toast } from 'react-toastify';

function downloadBlob(content, filename, mime) {
  const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const DATASETS = [
  { key: 'products',       label: 'Products',       icon: '🌸', csv: true },
  { key: 'categories',     label: 'Categories',     icon: '🏷️', csv: true },
  { key: 'users',          label: 'Users',          icon: '👥', csv: true, note: 'includes addresses' },
  { key: 'orders',         label: 'Orders',         icon: '📦', csv: true },
  { key: 'invoices',       label: 'Invoices',       icon: '🧾', csv: true },
  { key: 'analytics',      label: 'Analytics',      icon: '📈', csv: false },
  { key: 'contacts',       label: 'Messages',       icon: '💬', csv: true },
  { key: 'reviews',        label: 'Reviews',        icon: '⭐', csv: true },
  { key: 'coupons',        label: 'Coupons',        icon: '🎟️', csv: true },
  { key: 'subscribers',    label: 'Subscribers',    icon: '📧', csv: false },
  { key: 'changelog',      label: 'Changelog',      icon: '📝', csv: false },
  { key: 'supportTickets', label: 'Support Tickets',icon: '🎧', csv: false },
];

function download(content, filename, mime) {
  downloadBlob(content, filename, mime);
}

export default function ImportExport() {
  const [exporting, setExporting]       = useState({});
  const [fullBackupBusy, setFullBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy]   = useState(false);
  const [restoreResults, setRestoreResults] = useState(null);
  const restoreRef = useRef();

  const handleFullBackup = async () => {
    setFullBackupBusy(true);
    try {
      const { data } = await dataAPI.export('all', 'json');
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(data, `full-backup-${date}.json`, 'application/json');
      toast.success('Full backup downloaded!');
    } catch { toast.error('Backup failed'); }
    setFullBackupBusy(false);
  };

  const handleRestoreFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    setRestoreResults(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const bundle = JSON.parse(ev.target.result);
        if (!bundle.version || !bundle.exportedAt) {
          toast.error('Not a valid backup file. Use a full-backup-*.json downloaded from this page.');
          return;
        }
        setRestoreBusy(true);
        const { data } = await dataAPI.import(bundle, 'ignore');
        setRestoreResults(data.results);
        toast.success('Restore complete!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Restore failed');
      }
      setRestoreBusy(false);
    };
    reader.readAsText(f);
  };

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`;
    setExporting(e => ({ ...e, [key]: true }));
    try {
      const { data } = await dataAPI.export(type, format);
      const date = new Date().toISOString().slice(0, 10);
      const ext = format === 'csv' ? 'csv' : 'json';
      download(data, `${type}-${date}.${ext}`, format === 'csv' ? 'text/csv' : 'application/json');
      toast.success(`${type === 'all' ? 'Bundle' : type} exported`);
    } catch { toast.error('Export failed'); }
    setExporting(e => ({ ...e, [key]: false }));
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
        📂 <span className="gradient-text">Import / Export</span>
      </h1>

      {/* ── FULL BACKUP / RESTORE ── */}
      <div style={{ background: 'linear-gradient(135deg,#6c63ff,#a855f7)', borderRadius: 20, padding: 28, marginBottom: 28, color: 'white' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>One-Click</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>🗄️ Full Database Backup & Restore</h2>
        <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 24, maxWidth: 560 }}>
          Downloads every table — products, categories, users (with addresses), orders, invoices, coupons, subscribers, changelog, contacts, reviews, and support tickets — into a single JSON file. Use the same file to restore on any device or server.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={handleFullBackup}
            disabled={fullBackupBusy}
            style={{ background: 'white', color: '#6c63ff', fontWeight: 800, fontSize: 15, padding: '13px 28px', borderRadius: 14, border: 'none', cursor: fullBackupBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}
            onMouseEnter={e => { if (!fullBackupBusy) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            {fullBackupBusy ? '⏳ Exporting...' : '⬇️ Download Full Backup'}
          </button>

          <label
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, fontSize: 15, padding: '13px 28px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.4)', cursor: restoreBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!restoreBusy) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
            <input ref={restoreRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestoreFile} />
            {restoreBusy ? '⏳ Restoring...' : '⬆️ Restore from Backup'}
          </label>
        </div>

        {restoreResults && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Restore Results:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(restoreResults).map(([type, res]) => (
                <div key={type} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{type}</span>
                  {res.note
                    ? <span style={{ opacity: 0.7 }}> — {res.note}</span>
                    : <span> ✅ {res.imported} in · {res.skipped} skip</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── EXPORT ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 28 }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18 }}>📤 Export Data</h2>
          <p style={{ color: '#9e9e9e', fontSize: 13, marginTop: 4 }}>Download site data as JSON or CSV for backup or migration</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f7ff' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase' }}>Dataset</th>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase' }}>JSON</th>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase' }}>CSV</th>
            </tr>
          </thead>
          <tbody>
            {DATASETS.map(ds => (
              <tr key={ds.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 14 }}>
                  <span style={{ marginRight: 8 }}>{ds.icon}</span>{ds.label}
                  {ds.note && <span style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 400, marginLeft: 6 }}>({ds.note})</span>}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20, minWidth: 80 }}
                    onClick={() => handleExport(ds.key, 'json')}
                    disabled={exporting[`${ds.key}-json`]}>
                    {exporting[`${ds.key}-json`] ? '⏳' : '⬇️ JSON'}
                  </button>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {ds.csv ? (
                    <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#00b894', borderRadius: 20, minWidth: 80 }}
                      onClick={() => handleExport(ds.key, 'csv')}
                      disabled={exporting[`${ds.key}-csv`]}>
                      {exporting[`${ds.key}-csv`] ? '⏳' : '⬇️ CSV'}
                    </button>
                  ) : <span style={{ color: '#bdbdbd', fontSize: 13 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
