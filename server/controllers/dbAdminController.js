const REGISTRY = require('../config/dbAdminRegistry');

const DRAFT_PROMOTE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function getEntry(key) {
  const entry = REGISTRY[key];
  if (!entry) throw Object.assign(new Error('Unknown collection'), { status: 400 });
  return entry;
}

// Drafts older than a week are auto-promoted to trash. Trash itself is never auto-purged
// here — an admin must empty it from the Clean DB page (Products keep their own separate
// 30-day trash TTL, unrelated to this).
async function promoteDraftsToTrash() {
  const cutoff = new Date(Date.now() - DRAFT_PROMOTE_MS);
  for (const key of Object.keys(REGISTRY)) {
    const { model, statusField } = REGISTRY[key];
    await model.updateMany(
      { [statusField]: 'draft', draftedAt: { $lte: cutoff } },
      { $set: { [statusField]: 'trash', trashedAt: new Date() }, $unset: { draftedAt: '' } }
    );
  }
}

const getOverview = async (req, res) => {
  try {
    const overview = await Promise.all(Object.entries(REGISTRY).map(async ([key, entry]) => {
      const { model, statusField, activeValue, label, icon } = entry;
      const [total, draft, trash] = await Promise.all([
        model.countDocuments({}),
        model.countDocuments({ [statusField]: 'draft' }),
        model.countDocuments({ [statusField]: 'trash' }),
      ]);
      return { key, label, icon, total, draft, trash, active: total - draft - trash };
    }));
    res.json(overview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRecords = async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { model, statusField, columns } = entry;
    const filter = req.query.status ? { [statusField]: req.query.status } : {};
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const [records, total] = await Promise.all([
      model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      model.countDocuments(filter),
    ]);

    res.json({ records, total, page, totalPages: Math.ceil(total / limit), columns, statusField });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const setStatus = (targetStatus) => async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { model, statusField, activeValue } = entry;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });

    const value = targetStatus === 'active' ? activeValue : targetStatus;
    const update = { [statusField]: value };
    if (targetStatus === 'draft') { update.draftedAt = new Date(); update.trashedAt = null; }
    else if (targetStatus === 'trash') { update.trashedAt = new Date(); update.draftedAt = null; }
    else { update.draftedAt = null; update.trashedAt = null; }

    const result = await model.updateMany({ _id: { $in: ids } }, { $set: update });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const permanentDelete = async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { model, statusField } = entry;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });
    // Safety: only allow hard-deleting records that are already in trash.
    const result = await model.deleteMany({ _id: { $in: ids }, [statusField]: 'trash' });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const emptyTrash = async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { model, statusField } = entry;
    const result = await model.deleteMany({ [statusField]: 'trash' });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const scanDuplicates = async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { model, statusField, activeValue, dupeKey, display } = entry;
    const docs = await model.find({}).lean();

    const groups = new Map();
    for (const doc of docs) {
      const key = dupeKey(doc);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(doc);
    }

    const duplicateGroups = [...groups.values()]
      .filter(g => g.length > 1)
      .map(group => {
        const sorted = [...group].sort((a, b) => {
          const aTrash = a[statusField] === 'trash' ? 1 : 0;
          const bTrash = b[statusField] === 'trash' ? 1 : 0;
          if (aTrash !== bTrash) return aTrash - bTrash;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        const [keep, ...remove] = sorted;
        return {
          display: display(group[0]),
          keep: { id: keep._id, status: keep[statusField] || activeValue, createdAt: keep.createdAt },
          remove: remove.map(d => ({ id: d._id, status: d[statusField] || activeValue, createdAt: d.createdAt })),
        };
      });

    res.json({ groups: duplicateGroups, totalRemovable: duplicateGroups.reduce((n, g) => n + g.remove.length, 0) });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const removeDuplicates = async (req, res) => {
  try {
    const entry = getEntry(req.params.key);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });
    const result = await entry.model.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

module.exports = {
  promoteDraftsToTrash,
  getOverview,
  getRecords,
  moveToDraft: setStatus('draft'),
  moveToTrash: setStatus('trash'),
  restore: setStatus('active'),
  permanentDelete,
  emptyTrash,
  scanDuplicates,
  removeDuplicates,
};
