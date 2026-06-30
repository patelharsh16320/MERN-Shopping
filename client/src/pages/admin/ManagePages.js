import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { pageSettingAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function ManagePages() {
  const [pages, setPages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editingMeta, setEditingMeta] = useState(null); // key of page being edited
  const [metaDraft, setMetaDraft]     = useState({ metaTitle: '', metaDescription: '' });

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

  const openMeta = (page) => {
    setEditingMeta(page.key);
    setMetaDraft({ metaTitle: page.metaTitle || '', metaDescription: page.metaDescription || '' });
  };

  const saveMeta = async (pageKey) => {
    setSaving(pageKey + '_meta');
    try {
      const { data } = await pageSettingAPI.updateMeta(pageKey, metaDraft.metaTitle, metaDraft.metaDescription);
      setPages(prev => prev.map(p => p.key === data.key ? data : p));
      setEditingMeta(null);
      toast.success('Meta tags saved!');
    } catch {
      toast.error('Failed to save meta tags');
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
          Control visibility and SEO meta tags for each customer-facing page.
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
                <th>Meta Title</th>
                <th>Meta Description</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Toggle</th>
                <th style={{ textAlign: 'center' }}>SEO</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <React.Fragment key={page.key}>
                  <tr>
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
                    <td>
                      <span style={{ fontSize: 13, color: page.metaTitle ? '#333' : '#bdbdbd' }}>
                        {page.metaTitle || '(not set)'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span style={{ fontSize: 12, color: page.metaDescription ? '#636e72' : '#bdbdbd', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.metaDescription || '(not set)'}
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
                          position: 'relative', width: 52, height: 28, borderRadius: 14,
                          border: 'none', cursor: saving === page.key ? 'not-allowed' : 'pointer',
                          background: page.isActive ? 'linear-gradient(135deg,#00b894,#55efc4)' : '#dfe6e9',
                          transition: 'background 0.25s', outline: 'none', padding: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 3, left: page.isActive ? 26 : 4,
                          width: 22, height: 22, borderRadius: '50%', background: 'white',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s', display: 'block',
                        }} />
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => editingMeta === page.key ? setEditingMeta(null) : openMeta(page)}
                        style={{
                          padding: '5px 14px', borderRadius: 20,
                          border: '2px solid #6c63ff', background: editingMeta === page.key ? '#6c63ff' : 'white',
                          color: editingMeta === page.key ? 'white' : '#6c63ff',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {editingMeta === page.key ? '✕ Close' : '✎ Edit SEO'}
                      </button>
                    </td>
                  </tr>

                  {/* Inline SEO editor row */}
                  {editingMeta === page.key && (
                    <tr>
                      <td colSpan={7} style={{ background: '#f7f6ff', padding: '20px 24px', borderTop: '2px solid #e0e0ff' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 680 }}>
                          <div style={{ fontWeight: 700, color: '#6c63ff', marginBottom: 4 }}>
                            🔍 SEO Settings — {page.icon} {page.label}
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5 }}>
                              Meta Title <span style={{ color: '#9e9e9e', fontWeight: 400 }}>(appears in browser tab &amp; search results)</span>
                            </label>
                            <input
                              value={metaDraft.metaTitle}
                              onChange={e => setMetaDraft(d => ({ ...d, metaTitle: e.target.value }))}
                              placeholder="e.g. Home – Women HubClub"
                              maxLength={70}
                              style={{
                                width: '100%', padding: '9px 14px', borderRadius: 8,
                                border: '2px solid #d0cfff', outline: 'none', fontSize: 14,
                                fontFamily: 'inherit', boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ fontSize: 11, color: metaDraft.metaTitle.length > 60 ? '#e17055' : '#9e9e9e', marginTop: 3 }}>
                              {metaDraft.metaTitle.length}/70 characters {metaDraft.metaTitle.length > 60 ? '— keep under 60 for best display' : ''}
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5 }}>
                              Meta Description <span style={{ color: '#9e9e9e', fontWeight: 400 }}>(shown under the page title in search results)</span>
                            </label>
                            <textarea
                              value={metaDraft.metaDescription}
                              onChange={e => setMetaDraft(d => ({ ...d, metaDescription: e.target.value }))}
                              placeholder="e.g. Discover premium beauty products at Women HubClub..."
                              maxLength={160}
                              rows={3}
                              style={{
                                width: '100%', padding: '9px 14px', borderRadius: 8,
                                border: '2px solid #d0cfff', outline: 'none', fontSize: 14,
                                fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ fontSize: 11, color: metaDraft.metaDescription.length > 155 ? '#e17055' : '#9e9e9e', marginTop: 3 }}>
                              {metaDraft.metaDescription.length}/160 characters {metaDraft.metaDescription.length > 155 ? '— keep under 155 for best display' : ''}
                            </div>
                          </div>

                          {/* Live preview */}
                          <div style={{ borderRadius: 8, border: '1px solid #e0e0e0', padding: '14px 16px', background: 'white' }}>
                            <div style={{ fontSize: 11, color: '#9e9e9e', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Google Preview</div>
                            <div style={{ fontSize: 18, color: '#1a0dab', fontWeight: 600, marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {metaDraft.metaTitle || page.label}
                            </div>
                            <div style={{ fontSize: 13, color: '#006621', marginBottom: 4 }}>
                              https://yourdomain.com/{page.key === 'home' ? '' : page.key}
                            </div>
                            <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.5 }}>
                              {metaDraft.metaDescription || '(no description)'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={() => saveMeta(page.key)}
                              disabled={saving === page.key + '_meta'}
                              style={{
                                padding: '9px 24px', borderRadius: 20, border: 'none',
                                background: 'linear-gradient(135deg,#6c63ff,#a29bfe)', color: 'white',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              {saving === page.key + '_meta' ? 'Saving…' : '💾 Save SEO Tags'}
                            </button>
                            <button
                              onClick={() => setEditingMeta(null)}
                              style={{
                                padding: '9px 20px', borderRadius: 20,
                                border: '2px solid #dfe6e9', background: 'white',
                                color: '#636e72', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{
        marginTop: 24, padding: '16px 20px', borderRadius: 12,
        background: '#fff8e1', border: '1px solid #f39c12', color: '#856404', fontSize: 13,
      }}>
        <strong>Note:</strong> Core pages (Login, Register, Cart, Checkout, Orders, Profile) are always visible. Meta tags take effect immediately in the browser tab and are applied site-wide via React.
      </div>
    </AdminLayout>
  );
}
