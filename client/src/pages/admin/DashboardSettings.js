import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { dashboardWidgetAPI, adminNavAPI } from '../../utils/api';
import { toast } from 'react-toastify';

function ToggleTable({ items, columnLabel, statusOnLabel, statusOffLabel, savingKey, lockedKey, onToggle }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>{columnLabel}</th>
            <th style={{ textAlign: 'center' }}>Status</th>
            <th style={{ textAlign: 'center' }}>Toggle</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const locked = item.key === lockedKey;
            return (
              <tr key={item.key}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <span style={{ fontWeight: 700, color: '#333' }}>{item.label}</span>
                    {locked && <span style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 600 }}>(always visible)</span>}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: item.isActive ? '#e8fff5' : '#fff0f0',
                    color: item.isActive ? '#00b894' : '#d63031',
                    border: `1px solid ${item.isActive ? '#00b894' : '#d63031'}`,
                  }}>
                    {item.isActive ? `● ${statusOnLabel}` : `○ ${statusOffLabel}`}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => onToggle(item)}
                    disabled={locked || savingKey === item.key}
                    style={{
                      position: 'relative', width: 52, height: 28, borderRadius: 14, border: 'none',
                      cursor: locked ? 'not-allowed' : savingKey === item.key ? 'not-allowed' : 'pointer',
                      opacity: locked ? 0.5 : 1,
                      background: item.isActive ? 'linear-gradient(135deg,#00b894,#55efc4)' : '#dfe6e9',
                      transition: 'background 0.25s', outline: 'none', padding: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: item.isActive ? 26 : 4, width: 22, height: 22,
                      borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.25s', display: 'block',
                    }} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardSettings() {
  const [widgets, setWidgets] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    Promise.all([dashboardWidgetAPI.getAll(), adminNavAPI.getAll()])
      .then(([w, n]) => { setWidgets(w.data); setNavItems(n.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleWidget = async (widget) => {
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

  const toggleNavItem = async (item) => {
    setSaving(item.key);
    try {
      const { data } = await adminNavAPI.toggle(item.key, !item.isActive);
      setNavItems(prev => prev.map(n => n.key === data.key ? data : n));
      toast.success(`"${item.label}" menu item is now ${data.isActive ? 'SHOWN' : 'HIDDEN'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update menu setting');
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
          Control which widgets appear on your admin Dashboard page, and which items show up in the sidebar menu.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#636e72' }}>Loading…</div>
      ) : (
        <>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Dashboard Widgets</h3>
          <ToggleTable
            items={widgets}
            columnLabel="Widget"
            statusOnLabel="Shown"
            statusOffLabel="Hidden"
            savingKey={saving}
            onToggle={toggleWidget}
          />

          <h3 style={{ fontWeight: 700, fontSize: 16, margin: '32px 0 12px' }}>Sidebar Menu Items</h3>
          <ToggleTable
            items={navItems}
            columnLabel="Menu Item"
            statusOnLabel="Shown"
            statusOffLabel="Hidden"
            savingKey={saving}
            lockedKey="dashboard"
            onToggle={toggleNavItem}
          />
        </>
      )}
    </AdminLayout>
  );
}
