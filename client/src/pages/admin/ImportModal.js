import React, { useState, useRef } from 'react';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQ) { inQ = true; continue; }
      if (ch === '"' && inQ && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"' && inQ) { inQ = false; continue; }
      if (ch === ',' && !inQ) { values.push(cur); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']));
  });
}

export default function ImportModal({ entityName, onImport, onClose }) {
  const [items, setItems] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [duplicateAction, setDuplicateAction] = useState('ignore');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setItems(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        let parsed;
        if (file.name.endsWith('.csv')) {
          parsed = parseCSV(text);
          if (!parsed.length) throw new Error('No data rows found in CSV');
        } else {
          parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('File must contain a JSON array');
        }
        setItems(parsed);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!items?.length) return;
    setLoading(true);
    try {
      const res = await onImport(items, duplicateAction);
      setResult(res);
    } catch (err) {
      setParseError(err.response?.data?.message || 'Import failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, animation: 'zoomIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700 }}>📥 Import {entityName}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {!result ? (
          <>
            <div
              onClick={() => fileRef.current.click()}
              style={{ border: '2px dashed #d0c9ff', borderRadius: 16, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafe', marginBottom: 20, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d0c9ff'}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, color: '#424242' }}>{fileName || 'Click to choose a file'}</div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>
                Accepts <strong>.json</strong> or <strong>.csv</strong> exported from this system
              </div>
              <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleFile} style={{ display: 'none' }} />
            </div>

            {parseError && (
              <div style={{ background: '#ffebee', color: '#c62828', borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 16 }}>⚠️ {parseError}</div>
            )}

            {items && (
              <div style={{ background: '#f3f0ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#6c63ff', marginBottom: 4 }}>✅ {items.length} record{items.length !== 1 ? 's' : ''} found in file</div>
                <div style={{ fontSize: 13, color: '#636e72' }}>Choose how to handle existing {entityName.toLowerCase()} with the same name:</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { value: 'ignore', label: 'Skip duplicates', desc: 'Keep existing records, only add new ones' },
                { value: 'remove', label: 'Remove & replace duplicates', desc: 'Delete existing matching records, then import all' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '12px 16px', borderRadius: 12, border: `2px solid ${duplicateAction === opt.value ? '#6c63ff' : '#f0f0f0'}`, background: duplicateAction === opt.value ? '#f8f7ff' : 'white', transition: 'all 0.15s' }}>
                  <input type="radio" name="dupAction" value={opt.value} checked={duplicateAction === opt.value} onChange={() => setDuplicateAction(opt.value)} style={{ marginTop: 2, accentColor: '#6c63ff' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3436' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!items || loading}>
                {loading ? '⏳ Importing...' : `📥 Import ${items ? items.length : ''} Records`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#2d3436', marginBottom: 20 }}>Import Complete</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Imported', value: result.imported, color: '#00b894', bg: '#e8f8f5' },
                  { label: 'Skipped', value: result.skipped, color: '#636e72', bg: '#f5f5f5' },
                  { label: 'Removed', value: result.removed, color: '#e17055', bg: '#fff3f0' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '12px 20px', minWidth: 90, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#9e9e9e', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </div>
  );
}
