import React, { useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { dataAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const DATASETS = [
  { key: 'products',   label: 'Products',   icon: '🌸', csv: true },
  { key: 'categories', label: 'Categories', icon: '🏷️', csv: true },
  { key: 'users',      label: 'Users',      icon: '👥', csv: true },
  { key: 'orders',     label: 'Orders',     icon: '📦', csv: true },
  { key: 'invoices',   label: 'Invoices',   icon: '🧾', csv: true },
  { key: 'analytics',  label: 'Analytics',  icon: '📈', csv: false },
  { key: 'contacts',   label: 'Messages',   icon: '💬', csv: true },
  { key: 'reviews',    label: 'Reviews',    icon: '⭐', csv: true },
  { key: 'coupons',    label: 'Coupons',    icon: '🎟️', csv: true },
];

const IMPORTABLE = new Set(['products', 'categories', 'users', 'contacts', 'reviews', 'coupons']);

function download(content, filename, mime) {
  const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ImportExport() {
  const [exporting, setExporting] = useState({});
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileType, setFileType] = useState('');   // 'bundle' | specific key | ''
  const [csvType, setCsvType] = useState('');
  const [duplicateAction, setDuplicateAction] = useState('ignore');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

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

  const parseFile = (f) => {
    setFile(f);
    setFileData(null);
    setFileType('');
    setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (f.name.endsWith('.csv')) {
        setFileData(text);
        setFileType('csv');
        return;
      }
      try {
        const parsed = JSON.parse(text);
        if (parsed.version && parsed.exportedAt) {
          setFileData(parsed);
          setFileType('bundle');
        } else if (Array.isArray(parsed)) {
          setFileData(parsed);
          setFileType('array');
        } else {
          toast.error('Unrecognised JSON format');
        }
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(f);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  };

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) parseFile(f);
    e.target.value = '';
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = [];
      let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
        else cur += ch;
      }
      vals.push(cur);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.replace(/^"|"$/g, '') ?? '']));
    });
  };

  const handleImport = async () => {
    if (!fileData) return;
    setImporting(true);
    setResults(null);
    try {
      let bundle = {};

      if (fileType === 'bundle') {
        bundle = fileData;
      } else if (fileType === 'csv') {
        if (!csvType) { toast.error('Select a dataset type for this CSV'); setImporting(false); return; }
        bundle[csvType] = parseCSV(fileData);
      } else if (fileType === 'array') {
        if (!csvType) { toast.error('Select a dataset type for this JSON array'); setImporting(false); return; }
        bundle[csvType] = fileData;
      }

      const { data } = await dataAPI.import(bundle, duplicateAction);
      setResults(data.results);
      toast.success('Import complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
    setImporting(false);
  };

  const detectedTypes = fileType === 'bundle' && fileData
    ? Object.keys(fileData).filter(k => DATASETS.some(d => d.key === k) && (Array.isArray(fileData[k]) ? fileData[k].length > 0 : true))
    : [];

  const needsTypeSelect = fileType === 'csv' || fileType === 'array';

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>
        📂 <span className="gradient-text">Import / Export</span>
      </h1>

      {/* ── EXPORT ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>📤 Export Data</h2>
            <p style={{ color: '#9e9e9e', fontSize: 13, marginTop: 4 }}>Download site data as JSON or CSV for backup or migration</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleExport('all', 'json')}
            disabled={exporting['all-json']}
            style={{ whiteSpace: 'nowrap' }}>
            {exporting['all-json'] ? '⏳ Exporting...' : '⬇️ Download All (Bundle JSON)'}
          </button>
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

      {/* ── IMPORT ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>📥 Import Data</h2>
        <p style={{ color: '#9e9e9e', fontSize: 13, marginBottom: 22 }}>
          Upload a JSON bundle (all datasets) or a single JSON/CSV file. Importable: Products, Categories, Users, Messages, Reviews, Coupons.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? '#6c63ff' : '#d0c9ff'}`,
            borderRadius: 14, padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#f8f7ff' : '#fafafe', marginBottom: 20, transition: 'all 0.2s',
          }}>
          <input ref={fileRef} type="file" accept=".json,.csv" style={{ display: 'none' }} onChange={handleFileInput} />
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          {file ? (
            <div>
              <div style={{ fontWeight: 700, color: '#6c63ff', fontSize: 15 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>
                {fileType === 'bundle' ? `Bundle — detected: ${detectedTypes.join(', ')}` :
                 fileType === 'csv' ? 'CSV file — select dataset type below' :
                 fileType === 'array' ? 'JSON array — select dataset type below' : 'Parsing...'}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: '#636e72', fontSize: 14 }}>Drop file here or click to browse</div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>Supports .json and .csv</div>
            </div>
          )}
        </div>

        {file && fileData && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 22 }}>
            {needsTypeSelect && (
              <div className="form-group" style={{ margin: 0, minWidth: 220 }}>
                <label className="form-label">Dataset Type</label>
                <select className="form-select" value={csvType} onChange={e => setCsvType(e.target.value)}>
                  <option value="">— Select type —</option>
                  {DATASETS.filter(d => IMPORTABLE.has(d.key)).map(d => (
                    <option key={d.key} value={d.key}>{d.icon} {d.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ margin: 0, minWidth: 220 }}>
              <label className="form-label">Duplicate Handling</label>
              <select className="form-select" value={duplicateAction} onChange={e => setDuplicateAction(e.target.value)}>
                <option value="ignore">Skip existing (keep originals)</option>
                <option value="remove">Remove & replace duplicates</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={handleImport} disabled={importing}
              style={{ height: 42, alignSelf: 'flex-end' }}>
              {importing ? '⏳ Importing...' : '📥 Import Now'}
            </button>

            <button className="btn btn-secondary" onClick={() => { setFile(null); setFileData(null); setFileType(''); setResults(null); }}
              style={{ height: 42, alignSelf: 'flex-end' }}>
              Clear
            </button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ background: '#f8f7ff', borderRadius: 12, padding: 20, border: '1px solid #e8e6ff' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Import Results</div>
            {Object.entries(results).map(([type, res]) => {
              const ds = DATASETS.find(d => d.key === type);
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: 14 }}>
                  <span style={{ width: 80, fontWeight: 600 }}>{ds?.icon} {ds?.label || type}</span>
                  {res.note ? (
                    <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>{res.note}</span>
                  ) : (
                    <>
                      <span style={{ color: '#00b894', fontWeight: 700 }}>✅ {res.imported} imported</span>
                      {res.skipped > 0 && <span style={{ color: '#9e9e9e' }}>· {res.skipped} skipped</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
