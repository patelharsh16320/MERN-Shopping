import React, { useState, useEffect, useCallback } from 'react';
import { dbAdminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const STATUS_TABS = ['active', 'draft', 'trash'];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';
}

export default function CleanDatabase() {
  const [overview, setOverview] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [activeKey, setActiveKey] = useState(null);
  const [statusTab, setStatusTab] = useState('active');
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [dupeKey, setDupeKey] = useState(null);
  const [dupeGroups, setDupeGroups] = useState([]);
  const [dupeChecked, setDupeChecked] = useState(new Set());
  const [dupeLoading, setDupeLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const { data } = await dbAdminAPI.overview();
      setOverview(data);
    } catch { toast.error('Failed to load database overview'); }
    setLoadingOverview(false);
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const fetchRecords = useCallback(async (key, status, pageNum) => {
    setLoadingRecords(true);
    try {
      const { data } = await dbAdminAPI.records(key, { status, page: pageNum, limit: 10 });
      setRecords(data.records);
      setColumns(data.columns);
      setTotalPages(data.totalPages);
      setSelectedIds(new Set());
    } catch { toast.error('Failed to load records'); }
    setLoadingRecords(false);
  }, []);

  const openCollection = (key) => {
    setDupeKey(null);
    setActiveKey(key);
    setStatusTab('active');
    setPage(1);
    fetchRecords(key, 'active', 1);
  };

  const changeTab = (tab) => {
    setStatusTab(tab);
    setPage(1);
    fetchRecords(activeKey, tab, 1);
  };

  const changePage = (p) => {
    setPage(p);
    fetchRecords(activeKey, statusTab, p);
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleSelectAll = () => {
    const allOn = records.length > 0 && records.every(r => selectedIds.has(r._id));
    setSelectedIds(allOn ? new Set() : new Set(records.map(r => r._id)));
  };

  const runAction = async (fn, label) => {
    if (selectedIds.size === 0) return;
    try {
      await fn(activeKey, [...selectedIds]);
      toast.success(label);
      fetchRecords(activeKey, statusTab, page);
      fetchOverview();
    } catch { toast.error('Action failed'); }
  };

  const handlePermanentDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.size} record(s)? This cannot be undone.`)) return;
    runAction(dbAdminAPI.permanentDelete, 'Permanently deleted');
  };

  const handleEmptyTrash = async (key, trashCount) => {
    if (!window.confirm(`Permanently delete all ${trashCount} trashed record(s) in this collection right now? This cannot be undone.`)) return;
    try {
      const { data } = await dbAdminAPI.emptyTrash(key);
      toast.success(`Emptied trash — deleted ${data.deleted} record(s)`);
      fetchOverview();
      if (activeKey === key) fetchRecords(key, statusTab, page);
    } catch { toast.error('Failed to empty trash'); }
  };

  const handleDeleteAll = async (key, label, total) => {
    if (total === 0) return;
    const typed = window.prompt(`This permanently deletes ALL ${total} record(s) in "${label}" — active, draft, and trash. This cannot be undone.\n\nType "${label}" to confirm:`);
    if (typed !== label) {
      if (typed !== null) toast.error('Confirmation text did not match — nothing was deleted');
      return;
    }
    try {
      const { data } = await dbAdminAPI.deleteAll(key, label);
      toast.success(`Deleted all ${data.deleted} record(s) from ${label}`);
      fetchOverview();
      if (activeKey === key) setActiveKey(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete all data'); }
  };

  const openDuplicates = async (key) => {
    setActiveKey(null);
    setDupeKey(key);
    setDupeLoading(true);
    try {
      const { data } = await dbAdminAPI.duplicates(key);
      setDupeGroups(data.groups);
      setDupeChecked(new Set(data.groups.flatMap(g => g.remove.map(r => r.id))));
    } catch { toast.error('Failed to scan for duplicates'); }
    setDupeLoading(false);
  };

  const toggleDupeChecked = (id) => setDupeChecked(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const confirmRemoveDuplicates = async () => {
    if (dupeChecked.size === 0) return;
    if (!window.confirm(`Remove ${dupeChecked.size} duplicate record(s)? This cannot be undone.`)) return;
    try {
      const { data } = await dbAdminAPI.removeDuplicates(dupeKey, [...dupeChecked]);
      toast.success(`Removed ${data.deleted} duplicate(s)`);
      setDupeKey(null);
      fetchOverview();
    } catch { toast.error('Failed to remove duplicates'); }
  };

  const activeEntry = overview.find(o => o.key === activeKey);
  const dupeEntry = overview.find(o => o.key === dupeKey);

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 28 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>🧹 Clean Database</h2>
      <p style={{ color: '#9e9e9e', fontSize: 13, marginBottom: 22 }}>
        Browse and delete records across the database. Deleting moves a record to Draft; if left untouched for a week it auto-promotes to Trash, where it stays until you permanently delete it.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        {loadingOverview ? (
          <div style={{ color: '#9e9e9e', fontSize: 13 }}>Loading...</div>
        ) : overview.map(o => (
          <div key={o.key} style={{ border: '1px solid #f0f0f0', borderRadius: 14, padding: 16, background: '#fafafe' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{o.icon} {o.label}</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#636e72', marginBottom: 12, flexWrap: 'wrap' }}>
              <span>✅ {o.active} active</span>
              <span>📝 {o.draft} draft</span>
              <span>🗑️ {o.trash} trash</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openCollection(o.key)}>Manage</button>
              <button className="btn btn-sm" style={{ background: '#fff8f0', color: '#e17055', borderRadius: 20 }} onClick={() => openDuplicates(o.key)}>Dedupe</button>
              {o.trash > 0 && (
                <button className="btn btn-sm" style={{ background: '#fff0f0', color: '#d63031', borderRadius: 20 }} onClick={() => handleEmptyTrash(o.key, o.trash)}>
                  🗑️ Empty Trash
                </button>
              )}
              {o.total > 0 && (
                <button className="btn btn-sm" style={{ background: '#2d2d2d', color: 'white', borderRadius: 20 }} onClick={() => handleDeleteAll(o.key, o.label, o.total)}>
                  💀 Delete All Data
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeKey && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, padding: 18, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{activeEntry?.icon} {activeEntry?.label}</div>
            <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setActiveKey(null)}>✕ Close</button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => changeTab(tab)}
                style={{ padding: '6px 16px', borderRadius: 20, border: `2px solid ${statusTab === tab ? '#6c63ff' : '#e0e0e0'}`, background: statusTab === tab ? '#f0f0ff' : 'white', color: statusTab === tab ? '#6c63ff' : '#636e72', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#f8f7ff', borderRadius: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#6c63ff' }}>{selectedIds.size} selected</span>
              {statusTab === 'active' && <button className="btn btn-sm" style={{ background: '#fff8f0', color: '#e17055' }} onClick={() => runAction(dbAdminAPI.moveToDraft, 'Moved to draft')}>📝 Move to Draft</button>}
              {statusTab === 'draft' && <button className="btn btn-sm" style={{ background: '#fff0f0', color: '#d63031' }} onClick={() => runAction(dbAdminAPI.moveToTrash, 'Moved to trash')}>🗑️ Move to Trash Now</button>}
              {statusTab !== 'active' && <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#00b894' }} onClick={() => runAction(dbAdminAPI.restore, 'Restored')}>↩ Restore</button>}
              {statusTab === 'trash' && <button className="btn btn-sm btn-danger" onClick={handlePermanentDelete}>❌ Delete Permanently</button>}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f7ff' }}>
                  <th style={{ padding: '8px 10px', width: 36 }}>
                    <input type="checkbox" checked={records.length > 0 && records.every(r => selectedIds.has(r._id))} onChange={toggleSelectAll} />
                  </th>
                  {columns.map(c => <th key={c} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase' }}>{c}</th>)}
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecords ? (
                  <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: 30, color: '#636e72' }}>Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: 30, color: '#9e9e9e' }}>No records.</td></tr>
                ) : records.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 10px' }}><input type="checkbox" checked={selectedIds.has(r._id)} onChange={() => toggleSelect(r._id)} /></td>
                    {columns.map(c => <td key={c} style={{ padding: '8px 10px', fontSize: 13 }}>{String(r[c] ?? '—')}</td>)}
                    <td style={{ padding: '8px 10px', fontSize: 12, color: '#636e72', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
              <button className="page-btn" disabled={page === 1} onClick={() => changePage(page - 1)}>‹</button>
              <span style={{ fontSize: 13, color: '#636e72', alignSelf: 'center' }}>Page {page} / {totalPages}</span>
              <button className="page-btn" disabled={page === totalPages} onClick={() => changePage(page + 1)}>›</button>
            </div>
          )}
        </div>
      )}

      {dupeKey && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{dupeEntry?.icon} Duplicates in {dupeEntry?.label}</div>
            <button className="btn btn-sm" style={{ background: '#f5f5f5', color: '#636e72' }} onClick={() => setDupeKey(null)}>✕ Close</button>
          </div>

          {dupeLoading ? (
            <div style={{ color: '#636e72', fontSize: 13, padding: 20, textAlign: 'center' }}>Scanning...</div>
          ) : dupeGroups.length === 0 ? (
            <div style={{ color: '#9e9e9e', fontSize: 13, padding: 20, textAlign: 'center' }}>No duplicates found.</div>
          ) : (
            <>
              {dupeGroups.map((g, i) => (
                <div key={i} style={{ border: '1px solid #f5f5f5', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{g.display}</div>
                  <div style={{ fontSize: 12, color: '#00b894', marginBottom: 4 }}>✅ Keep: {fmtDate(g.keep.createdAt)} ({g.keep.status})</div>
                  {g.remove.map(r => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d63031', marginTop: 4, cursor: 'pointer' }}>
                      <input type="checkbox" checked={dupeChecked.has(r.id)} onChange={() => toggleDupeChecked(r.id)} />
                      Remove: {fmtDate(r.createdAt)} ({r.status})
                    </label>
                  ))}
                </div>
              ))}
              <button className="btn btn-danger" disabled={dupeChecked.size === 0} onClick={confirmRemoveDuplicates}>
                ❌ Remove {dupeChecked.size} Duplicate(s)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
