const BlogComment = require('../models/BlogComment');

const submit = async (req, res) => {
  try {
    const { postSlug, postTitle, name, email, body } = req.body;
    if (!postSlug || !name?.trim() || !body?.trim())
      return res.status(400).json({ message: 'Post slug, name and comment are required' });
    const comment = await BlogComment.create({
      postSlug, postTitle: postTitle || '',
      name: name.trim(), email: email?.trim() || '',
      body: body.trim(),
      userId: req.user?._id || null,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getForPost = async (req, res) => {
  try {
    const comments = await BlogComment.find({ postSlug: req.params.slug, status: 'approved' }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { status, slug } = req.query;
    const query = {};
    if (status) query.status = status;
    if (slug) query.postSlug = slug;
    const comments = await BlogComment.find(query).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      BlogComment.countDocuments(),
      BlogComment.countDocuments({ status: 'pending' }),
      BlogComment.countDocuments({ status: 'approved' }),
      BlogComment.countDocuments({ status: 'rejected' }),
    ]);
    res.json({ total, pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const comment = await BlogComment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const comment = await BlogComment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status) return res.status(400).json({ message: 'ids and status required' });
    await BlogComment.updateMany({ _id: { $in: ids } }, { status });
    res.json({ updated: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids required' });
    await BlogComment.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submit, getForPost, getAll, getStats, updateStatus, remove, bulkUpdate, bulkDelete };
