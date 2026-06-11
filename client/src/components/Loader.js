import React from 'react';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p style={{ color: '#636e72', fontSize: 14 }}>{text}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(108,99,255,0.1)' }}>
      <div className="skeleton" style={{ height: 220 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 24, width: '40%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 38, borderRadius: 50 }} />
      </div>
    </div>
  );
}
