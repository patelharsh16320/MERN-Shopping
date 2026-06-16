import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { changelogAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const TAG_COLORS = {
  SEO:           { bg: '#e8f5e9', color: '#2e7d32' },
  Promotions:    { bg: '#fff8e1', color: '#e65100' },
  Catalog:       { bg: '#f3e5f5', color: '#6a1b9a' },
  Communication: { bg: '#e3f2fd', color: '#1565c0' },
  Security:      { bg: '#fce4ec', color: '#c62828' },
  UX:            { bg: '#f0f0ff', color: '#6c63ff' },
  'Admin UX':    { bg: '#e0f7fa', color: '#00695c' },
  Data:          { bg: '#fff3e0', color: '#e65100' },
  Feature:       { bg: '#f3e5f5', color: '#7b1fa2' },
  Fix:           { bg: '#fce4ec', color: '#ad1457' },
  Performance:   { bg: '#e8f5e9', color: '#1b5e20' },
};

const DEFAULT_FEATURES = [
  { icon: '🔗', tag: 'SEO', title: 'Product URL Slugs', date: 'Jun 2026', summary: 'Clean, readable URLs for every product page instead of cryptic MongoDB IDs.', before: { label: 'URL used MongoDB Object ID', code: '/products/6642f3a1b2c4e5d6a7f8901b', points: ['Not human-readable', 'Bad for SEO', 'Cannot be shared meaningfully'] }, after: { label: 'Auto-generated slug + admin can customise', code: '/products/rose-water-mist', points: ['Auto-generated from product name on create', 'Admin can override with any custom slug', 'Inline edit right from the product table', 'Live preview shown while typing'] }, order: 10 },
  { icon: '🎟️', tag: 'Promotions', title: 'Coupon Code System', date: 'Jun 2026', summary: 'Full coupon management — create, edit, bulk delete, and apply codes at checkout.', before: { label: 'Hardcoded WELCOME10 promo only', code: "// Cart.js — hardcoded\nif (promoCode === 'WELCOME10') discount = 10%;", points: ['Single hardcoded code', 'Always 10% — no config', 'No expiry or usage limits'] }, after: { label: 'Admin CRUD with full validation', code: 'POST /api/coupons/validate\n{ code, orderTotal } → { discount, type }', points: ['Percentage or fixed-amount discounts', 'Expiry date, usage limits, min order amount', 'Toggle active/inactive instantly', 'Usage counter auto-increments on checkout', 'Import / Export included'] }, order: 20 },
  { icon: '🏷️', tag: 'Catalog', title: 'Category Hierarchy', date: 'Jun 2026', summary: 'Subcategory support — products can belong to a parent and a child category.', before: { label: 'Flat list, no nesting', code: 'category: "Skincare"   // only one level', points: ['No subcategories', 'All categories at same level', '"General" could be deleted accidentally'] }, after: { label: 'Parent → Subcategory tree', code: 'category: "Skincare"\nsubcategory: "Moisturisers"', points: ['"General" is protected — cannot be deleted', 'Subcategory dropdown appears when parent has children', 'Bulk activate / deactivate / delete categories'] }, order: 30 },
  { icon: '💬', tag: 'Communication', title: 'Admin → User Messaging', date: 'Jun 2026', summary: "Admin replies to contact messages are delivered to the user's profile inbox.", before: { label: 'One-way contact form only', code: 'Contact form → DB → Admin reads → dead end', points: ['Admin could read messages', 'No way to reply', 'Users had no inbox'] }, after: { label: 'Two-way with unread badges', code: "Admin replies → userRead: false\nProfile \"My Messages\" shows 🔵 badge", points: ['Admin types reply in admin panel', 'User sees unread badge on Profile sidebar', 'Thread expands to show all replies', 'Auto-marked read when user opens the message'] }, order: 40 },
  { icon: '🔐', tag: 'Security', title: 'Secure User Data Page', date: 'Jun 2026', summary: 'Password-locked admin page showing user emails, bcrypt hashes, and password reset.', before: { label: 'No way to inspect or reset user credentials', code: '// No endpoint for admin password ops', points: ['Could not see which users existed', 'No admin password reset for users'] }, after: { label: 'Locked behind harsh@1234', code: 'GET /api/users/secure-dump  (admin only)\nPUT /api/users/:id/reset-password\nPUT /api/users/:id (name change)', points: ['Password: harsh@1234 to unlock', 'Shows email, bcrypt hash (not plaintext)', 'Reset any user\'s password', 'Change username per user', 'Pagination, sort, column toggles'] }, order: 50 },
  { icon: '📦', tag: 'UX', title: 'Orders Page — Column Toggles & Search', date: 'Jun 2026', summary: 'User orders page rebuilt with search, sort, column visibility, and status filters.', before: { label: 'Simple list, no controls', code: 'orders.map(o => <OrderCard ... />)', points: ['No search', 'No sort', 'All items always shown', 'No status filter tabs'] }, after: { label: 'Full table with toolbar', code: 'Columns: Items | Total | Payment | Status | Date\nSearch by Order ID or item name', points: ['5 toggleable columns saved to localStorage', 'Sort by date, total, or status', 'Status tabs: All / Pending / Shipped / Delivered…', 'Pagination 10 per page'] }, order: 60 },
  { icon: '👥', tag: 'Admin UX', title: 'Bulk User Activate / Deactivate', date: 'Jun 2026', summary: 'Select multiple users and activate or deactivate them in one click.', before: { label: 'Toggle one user at a time', code: 'PUT /api/users/:id  { isActive: false }', points: ['Had to edit each user individually', 'No multi-select'] }, after: { label: 'Checkbox multi-select + bulk bar', code: 'Promise.all(ids.map(id => userAPI.update(id, { isActive })))', points: ['Checkbox per row + select all on page', 'Activate / Deactivate in bulk', 'Admin accounts always protected'] }, order: 70 },
  { icon: '🗂️', tag: 'Admin UX', title: 'Bulk Category Actions', date: 'Jun 2026', summary: 'Bulk activate, deactivate, or delete multiple categories at once.', before: { label: 'Edit / delete one category at a time', code: 'DELETE /api/categories/:id  // one at a time', points: ['No multi-select', '"General" category could be accidentally selected'] }, after: { label: 'Checkbox + bulk action bar', code: 'Promise.all(ids.map(id => categoryAPI.delete(id)))', points: ['"General" default category excluded from selection', 'Activate / Deactivate / Delete in one action', 'Confirmation dialog before delete'] }, order: 80 },
  { icon: '📂', tag: 'Data', title: 'Coupon Import / Export', date: 'Jun 2026', summary: 'Coupons added to the Import/Export system alongside products, users, etc.', before: { label: 'Coupons missing from data bundle', code: 'bundle = { products, categories, users, orders }', points: ['Coupon data lost on backup/restore', 'No CSV export for coupons'] }, after: { label: 'Full coupon support in data bundle', code: "bundle = { ..., coupons: [...] }\nCSV fields: code, discountType, discountValue, ...", points: ['Export coupons as JSON or CSV', 'Import with duplicate handling (skip / replace)', 'usageCount reset to 0 on import'] }, order: 90 },

  // ── Jun 14 2026 ──
  { icon: '📍', tag: 'Feature', title: 'User Address Book', date: 'Jun 14 2026', summary: 'Separate UserAddress collection with full CRUD — seeded with 4 Indian dummy addresses per user.', before: { label: 'Addresses embedded inside User document', code: 'User.addresses = [{ street, city, ... }]', points: ['No standalone address management', 'Import/export did not include addresses', 'Admin had no UI to view user addresses'] }, after: { label: 'Standalone UserAddress collection + admin UI', code: 'GET  /api/addresses/user/:userId\nPOST /api/addresses/user/:userId\nPUT  /api/addresses/:id\nDELETE /api/addresses/:id', points: ['Separate MongoDB collection — userId ref', 'Admin can view, add, edit, delete addresses per user', '📍 badge shows address count in Manage Users table', 'User import/export includes addresses array', '140 dummy Indian addresses seeded across 35 users'] }, order: 100 },
  { icon: '💾', tag: 'Data', title: 'Full Database Backup & Restore', date: 'Jun 14 2026', summary: 'One-click export of ALL collections into a single JSON bundle — restore on any device.', before: { label: 'Each collection exported separately', code: 'GET /api/data/export?type=products\nGET /api/data/export?type=users\n...', points: ['Had to export each collection individually', 'No way to restore a complete snapshot', 'Data migration between devices was manual'] }, after: { label: 'Single bundle export & restore', code: 'GET /api/data/export?type=all\n→ full-backup-2026-06-14.json\n\nPOST /api/data/import (bundle)\n→ { imported, skipped, errors }', points: ['Purple "Full Database Backup & Restore" panel on Import/Export page', 'Downloads as full-backup-YYYY-MM-DD.json', 'Restore validates bundle format before importing', 'Covers: products, categories, users, orders, invoices, coupons, subscribers, changelog, analytics, contacts'] }, order: 110 },
  { icon: '📦', tag: 'UX', title: 'Order Tracking Inside Chat', date: 'Jun 14 2026', summary: "Users can see all their order statuses in the chat widget's 📦 My Orders tab — no separate page needed.", before: { label: 'Chat widget was message-only', code: '<LiveChat />\n// only messaging, no order info', points: ['Users had to navigate to /orders to check status', 'No quick-glance order tracking', 'Chat and orders were completely separate'] }, after: { label: '2-tab chat: 💬 Chat + 📦 My Orders', code: 'OrdersTab → orderAPI.getMyOrders()\n→ status badge + progress steps bar\n→ item thumbnails + payment info', points: ['Tab switcher: Chat vs My Orders', 'Color-coded status badges (Pending/Processing/Shipped/Delivered/Cancelled)', 'Visual progress steps bar', 'Item thumbnails with quantity', '"📦 Track my orders" quick-button in empty chat state'] }, order: 120 },
  { icon: '🔔', tag: 'Feature', title: 'Live Unread Message Badge', date: 'Jun 14 2026', summary: 'Real-time +1/+2 counter on the chat button for both users and admins via Socket.io — no page refresh.', before: { label: 'No unread indicator on chat button', code: '// Static chat button, no badge', points: ['Had to open chat to see if new messages arrived', 'Admin had no live notification of new chats', 'Badge count reset on every navigation'] }, after: { label: 'Live badge with pulse animation', code: "localStorage key: chat_lastRead_${userId}\nonMount: count messages newer than lastRead\nsocket.on('new_message') → unread++", points: ['Badge persists across navigation via localStorage', 'Pulse animation on new messages', 'Shows even when popup is open (if on Orders tab)', '99+ cap for large counts', 'Both user and admin chat widgets updated'] }, order: 130 },
  { icon: '⚡', tag: 'Feature', title: 'Real-Time AJAX — Full Site', date: 'Jun 14 2026', summary: 'Socket.io powers live updates site-wide — new orders, product changes, user registrations — no page refresh.', before: { label: 'All data required a page reload', code: '// Must navigate away and back\n// or manually refresh browser', points: ['Admin dashboard stats were stale until refresh', 'New orders required page reload to appear', 'Product imports needed manual refresh to reflect', 'No live notification of new user registrations'] }, after: { label: 'Socket.io pub/sub across all key events', code: "// Server emits:\nio.to('admin_room').emit('new_order', data)\nio.to('public_room').emit('products_updated', data)\nio.to('admin_room').emit('new_user', data)\nio.to('user_${id}').emit('new_message', data)", points: ['Admin sidebar badge increments live on new order', 'Dashboard stat cards update without refresh', 'Products page auto-refreshes on import/create/update', 'Admin gets toast + badge on new order', 'Bot message auto-sent to user on order placement', 'Guest sockets supported (public_room)'] }, order: 140 },

  // ── Jun 15 2026 ──
  { icon: '🛍️', tag: 'UX', title: 'Post-Purchase Order Redirect', date: 'Jun 15 2026', summary: 'After checkout, users are redirected directly to their order detail page with a confirmation banner.', before: { label: 'Redirected to invoice page', code: "navigate(`/invoices/order/${data._id}`,\n  { state: { fromCheckout: true } })", points: ['Went to invoice — users expected order details', 'Order status not immediately visible', 'Confusing flow after payment'] }, after: { label: 'Redirected to order detail with banner', code: "navigate(`/orders/${data._id}`,\n  { state: { fromCheckout: true } })\n\n// OrderDetail.js shows:\n// 🎉 Order Confirmed! banner", points: ['Lands on /orders/:id — shows full order detail', '"🎉 Order Confirmed! Your order is being processed." banner at top', 'fromCheckout state triggers the banner automatically', 'Clear view of order status, items, and payment'] }, order: 150 },
  { icon: '🔘', tag: 'Admin UX', title: 'Admin Page Visibility Control', date: 'Jun 15 2026', summary: 'Admin can toggle any customer-facing page ON or OFF — inactive pages show a "Coming Soon" screen.', before: { label: 'All pages always visible to customers', code: '// No way to hide pages without deploying code', points: ['Could not disable seasonal pages (e.g. Offers)', 'No "Coming Soon" placeholder', 'Had to deploy code changes to hide pages'] }, after: { label: 'Toggle switches in Admin → Pages', code: 'GET  /api/page-settings   (public)\nPUT  /api/page-settings/:key  (admin)\n\nSocket: page_settings_updated → instant on all clients', points: ['8 controllable pages: Home, Shop, Offers, Quiz, About, Contact, Support, Wishlist', 'Toggle switch UI at /admin/pages', 'Inactive pages show 🚧 Coming Soon screen', 'Live update via socket — no page refresh needed for visitors', 'Core pages (Cart, Checkout, Orders, Profile) always accessible'] }, order: 160 },
  { icon: '🔍', tag: 'UX', title: 'Special Offers Filter Sidebar', date: 'Jun 15 2026', summary: 'Left sidebar with search, sort, discount filter, price range, offer type chips, and in-stock toggle on the Offers page.', before: { label: 'No filtering on Offers page', code: '// All offers shown in flat grid, no controls', points: ['Could not search deals', 'No way to sort by discount or price', 'Showed out-of-stock offers alongside in-stock'] }, after: { label: 'Full filter panel — desktop sidebar / mobile collapsible', code: 'filters = {\n  search, sort, minDiscount,\n  minPrice, maxPrice, labels[], inStock\n}', points: ['Search deals by name', 'Sort: Highest Discount / Price Low→High / High→Low / Ending Soon', 'Discount chips: All / 10%+ / 25%+ / 50%+ / 70%+', 'Price range min/max inputs', 'Offer type chips (dynamic from data)', 'In Stock Only toggle', 'Mobile: collapsible panel with active filter count badge'] }, order: 170 },
  { icon: '🎴', tag: 'UX', title: 'Special Offers Card Redesign', date: 'Jun 15 2026', summary: 'Complete offer card overhaul — hover scale, quantity stepper, wishlist button, star rating, low-stock bar, and animated Add to Cart.', before: { label: 'Basic card with plain Add to Cart button', code: '<button className="btn btn-primary" style={{ width: "100%" }}>\n  🛒 Add to Cart\n</button>', points: ['No quantity selection', 'No wishlist button', 'No star rating displayed', 'No low-stock indicator', 'Plain button with no feedback'] }, after: { label: 'Rich OfferCard component', code: '// Quantity stepper − [qty] +\n// Animated "✓ Added!" on click\n// Wishlist ❤️ / 🤍 top-right\n// Star rating + review count\n// Low-stock progress bar\n// Hover: image zoom + Quick View overlay', points: ['Image zooms on hover + "👁 Quick View" overlay appears', 'Wishlist button persists state across page', '5-star rating + review count', 'Quantity +/− stepper before Add to Cart', '"✓ Added!" animated green button on success', 'Low-stock progress bar (red, < 10 units)', 'Countdown timer redesigned with individual time-unit boxes', 'Skeleton loading placeholders'] }, order: 180 },

  // ── Jun 16 2026 ──
  { icon: '📝', tag: 'Security', title: 'Request Logs Now Show Email & Username', date: 'Jun 16 2026', summary: 'Server request logs now resolve and display the user\'s email and name instead of a raw user ID.', before: { label: 'Raw user ID in every log line', code: 'const line = [\n  formatTime(new Date()),\n  ip.padEnd(20),\n  (userId || \'guest\').padEnd(28),\n  ...\n];', points: ['Log lines only showed the MongoDB user ID', 'Had to manually look up which user an ID belonged to', 'Hard to audit who performed an action at a glance'] }, after: { label: 'Email + name resolved per request, with caching', code: "const userInfo = await getUserInfo(userId);\nconst userLabel = userInfo\n  ? `${userInfo.email} (${userInfo.name})`\n  : 'guest';", points: ['Log lines now show "email (name)" instead of a raw ID', 'In-memory cache (5 min TTL) avoids a DB hit on every request', 'Guests still logged as "guest"', 'Makes server/logs/YYYY-MM-DD.log files human-readable for auditing'] }, order: 190 },
];

const emptyForm = {
  icon: '✨', tag: '', title: '', date: '', summary: '',
  before: { label: '', code: '', points: [''] },
  after: { label: '', code: '', points: [''] },
  order: 0,
};

function CodeBlock({ code }) {
  return (
    <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '12px 16px', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', margin: '8px 0 0', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {code}
    </pre>
  );
}

function BeforeAfterCard({ side, data }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: side === 'before' ? '#fff8f8' : '#f8fff8', border: `1.5px solid ${side === 'before' ? '#ffcccc' : '#b2dfdb'}`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: side === 'before' ? '#c62828' : '#00695c', marginBottom: 8 }}>
        {side === 'before' ? '✕ Before' : '✓ After'}
        {data.label && <span style={{ fontWeight: 400, color: '#9e9e9e', fontSize: 12, marginLeft: 6 }}>— {data.label}</span>}
      </div>
      {data.code && <CodeBlock code={data.code} />}
      {data.points?.filter(Boolean).length > 0 && (
        <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
          {data.points.filter(Boolean).map((pt, i) => (
            <li key={i} style={{ fontSize: 13, color: '#424242', marginBottom: 4, lineHeight: 1.5 }}>{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PointsEditor({ points, onChange }) {
  const update = (i, val) => { const p = [...points]; p[i] = val; onChange(p); };
  const add = () => onChange([...points, '']);
  const remove = (i) => onChange(points.filter((_, j) => j !== i));
  return (
    <div>
      {points.map((pt, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input className="form-input" style={{ fontSize: 13 }} value={pt} placeholder={`Bullet point ${i + 1}`}
            onChange={e => update(i, e.target.value)} />
          {points.length > 1 && (
            <button type="button" onClick={() => remove(i)}
              style={{ padding: '6px 10px', background: '#fff0f0', color: '#d63031', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={add}
        style={{ fontSize: 12, color: '#6c63ff', background: 'none', border: '1.5px dashed #d0c9ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, marginTop: 2 }}>
        + Add bullet
      </button>
    </div>
  );
}

export default function WhatsNew() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterTag, setFilterTag] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchEntries = () => {
    setLoading(true);
    changelogAPI.getAll()
      .then(r => setEntries(r.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, []);

  const openAdd = () => {
    setEditing(null);
    const today = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    setForm({ ...emptyForm, date: today, before: { label: '', code: '', points: [''] }, after: { label: '', code: '', points: [''] } });
    setModal(true);
  };

  const openEdit = (entry) => {
    setEditing(entry._id);
    setForm({
      icon: entry.icon || '✨',
      tag: entry.tag || '',
      title: entry.title || '',
      date: entry.date || '',
      summary: entry.summary || '',
      order: entry.order || 0,
      before: { label: entry.before?.label || '', code: entry.before?.code || '', points: entry.before?.points?.length ? entry.before.points : [''] },
      after: { label: entry.after?.label || '', code: entry.after?.code || '', points: entry.after?.points?.length ? entry.after.points : [''] },
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.tag.trim()) return toast.error('Title and Tag are required');
    setSaving(true);
    try {
      if (editing) {
        await changelogAPI.update(editing, form);
        toast.success('Feature updated');
      } else {
        await changelogAPI.create(form);
        toast.success('Feature added to What\'s New!');
      }
      setModal(false);
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from What's New?`)) return;
    try {
      await changelogAPI.delete(id);
      toast.success('Removed');
      fetchEntries();
    } catch { toast.error('Delete failed'); }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm(`This will add ${DEFAULT_FEATURES.length} default feature entries. Continue?`)) return;
    setSeeding(true);
    try {
      await changelogAPI.bulkCreate(DEFAULT_FEATURES);
      toast.success(`${DEFAULT_FEATURES.length} default features added!`);
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seed failed');
    }
    setSeeding(false);
  };

  const allTags = [...new Set(entries.map(e => e.tag))].filter(Boolean);
  const visible = filterTag ? entries.filter(e => e.tag === filterTag) : entries;

  const setBeforeField = (field, val) => setForm(f => ({ ...f, before: { ...f.before, [field]: val } }));
  const setAfterField = (field, val) => setForm(f => ({ ...f, after: { ...f.after, [field]: val } }));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            ✨ <span className="gradient-text">What's New</span>
          </h1>
          <p style={{ color: '#9e9e9e', fontSize: 14 }}>All features added to this admin panel — with before/after comparisons.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f0f0ff', borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#6c63ff' }}>
            {entries.length} features
          </div>
          {entries.length === 0 && !loading && (
            <button className="btn btn-secondary" onClick={handleSeedDefaults} disabled={seeding}>
              {seeding ? '⏳ Loading...' : '🌱 Load Default Features'}
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Feature</button>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={() => setFilterTag('')}
            style={{ padding: '5px 16px', borderRadius: 20, border: `2px solid ${!filterTag ? '#6c63ff' : '#e0e0e0'}`, background: !filterTag ? '#f0f0ff' : 'white', color: !filterTag ? '#6c63ff' : '#9e9e9e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            All ({entries.length})
          </button>
          {allTags.map(tag => {
            const tc = TAG_COLORS[tag] || { bg: '#f0f0ff', color: '#6c63ff' };
            const active = filterTag === tag;
            const count = entries.filter(e => e.tag === tag).length;
            return (
              <button key={tag} onClick={() => setFilterTag(tag)}
                style={{ padding: '5px 16px', borderRadius: 20, border: `2px solid ${active ? tc.color : '#e0e0e0'}`, background: active ? tc.bg : 'white', color: active ? tc.color : '#9e9e9e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9e9e9e', fontSize: 16 }}>Loading features...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No features yet</div>
          <p style={{ color: '#9e9e9e', marginBottom: 20 }}>Add your first feature entry, or load the defaults to pre-populate.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleSeedDefaults} disabled={seeding}>{seeding ? '⏳...' : '🌱 Load Defaults'}</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Feature</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visible.map(feat => {
            const tc = TAG_COLORS[feat.tag] || { bg: '#f0f0ff', color: '#6c63ff' };
            const open = expanded === feat._id;
            return (
              <div key={feat._id} style={{ background: 'white', borderRadius: 18, border: `1.5px solid ${open ? '#6c63ff44' : '#f0f0f0'}`, boxShadow: open ? '0 4px 24px rgba(108,99,255,0.10)' : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px' }}>
                  {/* Expand toggle */}
                  <span style={{ fontSize: 28, flexShrink: 0, cursor: 'pointer' }} onClick={() => setExpanded(open ? null : feat._id)}>{feat.icon}</span>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpanded(open ? null : feat._id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{feat.title}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color }}>{feat.tag}</span>
                      {feat.date && <span style={{ fontSize: 12, color: '#bdbdbd' }}>{feat.date}</span>}
                    </div>
                    {feat.summary && <div style={{ fontSize: 13, color: '#636e72', marginTop: 3 }}>{feat.summary}</div>}
                  </div>
                  {/* Admin actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" style={{ background: '#f0f0ff', color: '#6c63ff', borderRadius: 20 }} onClick={() => openEdit(feat)}>✏️</button>
                    <button className="btn btn-sm" style={{ background: '#fff0f0', color: '#d63031', borderRadius: 20 }} onClick={() => handleDelete(feat._id, feat.title)}>🗑</button>
                  </div>
                  <span style={{ fontSize: 18, color: '#9e9e9e', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', cursor: 'pointer', flexShrink: 0 }} onClick={() => setExpanded(open ? null : feat._id)}>▾</span>
                </div>

                {open && (
                  <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f5f5f5' }}>
                    <div style={{ paddingTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <BeforeAfterCard side="before" data={feat.before || {}} />
                      <BeforeAfterCard side="after" data={feat.after || {}} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', animation: 'zoomIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20 }}>{editing ? '✏️ Edit Feature' : '➕ Add New Feature'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Icon</label>
                  <input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={{ textAlign: 'center', fontSize: 22 }} maxLength={4} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tag / Category *</label>
                  <input className="form-input" list="tag-list" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. UX, SEO, Security" required />
                  <datalist id="tag-list">
                    {Object.keys(TAG_COLORS).map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date</label>
                  <input className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="Jun 2026" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} style={{ width: 80 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Feature name" required />
              </div>

              <div className="form-group">
                <label className="form-label">Summary</label>
                <input className="form-input" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="One-line description shown in the collapsed card" />
              </div>

              {/* Before / After side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
                {/* BEFORE */}
                <div style={{ background: '#fff8f8', borderRadius: 14, padding: 16, border: '1.5px solid #ffcccc' }}>
                  <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 12, fontSize: 14 }}>✕ Before</div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Label</label>
                    <input className="form-input" style={{ fontSize: 13 }} value={form.before.label} onChange={e => setBeforeField('label', e.target.value)} placeholder="e.g. Hardcoded promo only" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Code snippet</label>
                    <textarea className="form-input" rows={3} style={{ fontSize: 12, fontFamily: 'monospace' }} value={form.before.code} onChange={e => setBeforeField('code', e.target.value)} placeholder="// code or URL or pseudo-code" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Bullet points</label>
                    <PointsEditor points={form.before.points} onChange={pts => setBeforeField('points', pts)} />
                  </div>
                </div>

                {/* AFTER */}
                <div style={{ background: '#f8fff8', borderRadius: 14, padding: 16, border: '1.5px solid #b2dfdb' }}>
                  <div style={{ fontWeight: 700, color: '#00695c', marginBottom: 12, fontSize: 14 }}>✓ After</div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Label</label>
                    <input className="form-input" style={{ fontSize: 13 }} value={form.after.label} onChange={e => setAfterField('label', e.target.value)} placeholder="e.g. Full CRUD with validation" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Code snippet</label>
                    <textarea className="form-input" rows={3} style={{ fontSize: 12, fontFamily: 'monospace' }} value={form.after.code} onChange={e => setAfterField('code', e.target.value)} placeholder="// code or URL or API route" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Bullet points</label>
                    <PointsEditor points={form.after.points} onChange={pts => setAfterField('points', pts)} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update Feature' : '✨ Add Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
