import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { pageSettingAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function ManagePages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    pageSettingAPI.getAll()
      .then(({ data }) => { setPages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (page) => {
    setSaving(page.key);
    try {
      const { data } = await pageSettingAPI.toggle(page.key, !page.isActive);
      setPages(prev => prev.map(p => p.key === data.key ? data : p));
      toast.success(`"${page.label}" is now ${data.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    } catch {
      toast.error('Failed to update page setting');
    }
    setSaving(null);
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          🔘 <span className="gradient-text">Manage Pages</span>
        </h1>
        <p style={{ color: '#636e72' }}>
          Control which pages are visible to customers. Inactive pages show a "Coming Soon" message.
        </p>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#636e72' }}>Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>URL</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.key}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{page.icon}</span>
                      <span style={{ fontWeight: 700, color: '#333' }}>{page.label}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: '#6c63ff', fontSize: 13 }}>
                      /{page.key === 'home' ? '' : page.key}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: page.isActive ? '#e8fff5' : '#fff0f0',
                      color: page.isActive ? '#00b894' : '#d63031',
                      border: `1px solid ${page.isActive ? '#00b894' : '#d63031'}`,
                    }}>
                      {page.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggle(page)}
                      disabled={saving === page.key}
                      style={{
                        position: 'relative',
                        width: 52,
                        height: 28,
                        borderRadius: 14,
                        border: 'none',
                        cursor: saving === page.key ? 'not-allowed' : 'pointer',
                        background: page.isActive ? 'linear-gradient(135deg,#00b894,#55efc4)' : '#dfe6e9',
                        transition: 'background 0.25s',
                        outline: 'none',
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 3,
                        left: page.isActive ? 26 : 4,
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

      <div style={{
        marginTop: 24,
        padding: '16px 20px',
        borderRadius: 12,
        background: '#fff8e1',
        border: '1px solid #f39c12',
        color: '#856404',
        fontSize: 13,
      }}>
        <strong>Note:</strong> Core pages like Login, Register, Cart, Checkout, Orders, and Profile are always visible and cannot be deactivated here.
      </div>
    </AdminLayout>
  );
}
