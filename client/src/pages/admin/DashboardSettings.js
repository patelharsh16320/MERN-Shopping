import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { dashboardWidgetAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function DashboardSettings() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    dashboardWidgetAPI.getAll()
      .then(({ data }) => { setWidgets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (widget) => {
    setSaving(widget.key);
    try {
      const { data } = await dashboardWidgetAPI.toggle(widget.key, !widget.isActive);
      setWidgets(prev => prev.map(w => w.key === data.key ? data : w));
      toast.success(`"${widget.label}" is now ${data.isActive ? 'SHOWN' : 'HIDDEN'}`);
    } catch {
      toast.error('Failed to update widget setting');
    }
    setSaving(null);
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          🧩 <span className="gradient-text">Dashboard Settings</span>
        </h1>
        <p style={{ color: '#636e72' }}>
          Control which widgets and sections appear on your admin Dashboard page.
        </p>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#636e72' }}>Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Widget</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {widgets.map(widget => (
                <tr key={widget.key}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{widget.icon}</span>
                      <span style={{ fontWeight: 700, color: '#333' }}>{widget.label}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: widget.isActive ? '#e8fff5' : '#fff0f0',
                      color: widget.isActive ? '#00b894' : '#d63031',
                      border: `1px solid ${widget.isActive ? '#00b894' : '#d63031'}`,
                    }}>
                      {widget.isActive ? '● Shown' : '○ Hidden'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggle(widget)}
                      disabled={saving === widget.key}
                      style={{
                        position: 'relative',
                        width: 52,
                        height: 28,
                        borderRadius: 14,
                        border: 'none',
                        cursor: saving === widget.key ? 'not-allowed' : 'pointer',
                        background: widget.isActive ? 'linear-gradient(135deg,#00b894,#55efc4)' : '#dfe6e9',
                        transition: 'background 0.25s',
                        outline: 'none',
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 3,
                        left: widget.isActive ? 26 : 4,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        transition: 'left 0.25s',
                        display: 'block',
                      }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
