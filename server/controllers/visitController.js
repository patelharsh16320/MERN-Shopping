const Visit = require('../models/Visit');

const recordVisit = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const { page, userId } = req.body;
    await Visit.create({ page: page || '/', ip, userId: userId || null });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const yearStart = new Date(now); yearStart.setMonth(0, 1); yearStart.setHours(0, 0, 0, 0);
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last12m = new Date(now - 365 * 24 * 60 * 60 * 1000);

    const [total, today, thisMonth, thisYear, loggedIn, anonymous, daily, monthly, yearly, userVisits] = await Promise.all([
      Visit.countDocuments(),
      Visit.countDocuments({ createdAt: { $gte: todayStart } }),
      Visit.countDocuments({ createdAt: { $gte: monthStart } }),
      Visit.countDocuments({ createdAt: { $gte: yearStart } }),
      Visit.countDocuments({ userId: { $ne: null } }),
      Visit.countDocuments({ userId: null }),

      Visit.aggregate([
        { $match: { createdAt: { $gte: last30 } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          uniqueIps: { $addToSet: '$ip' },
        }},
        { $project: { date: '$_id', total: 1, unique: { $size: '$uniqueIps' }, _id: 0 } },
        { $sort: { date: 1 } },
      ]),

      Visit.aggregate([
        { $match: { createdAt: { $gte: last12m } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: 1 },
          uniqueIps: { $addToSet: '$ip' },
        }},
        { $project: { month: '$_id', total: 1, unique: { $size: '$uniqueIps' }, _id: 0 } },
        { $sort: { month: 1 } },
      ]),

      Visit.aggregate([
        { $group: {
          _id: { $year: '$createdAt' },
          total: { $sum: 1 },
          uniqueIps: { $addToSet: '$ip' },
        }},
        { $project: { year: '$_id', total: 1, unique: { $size: '$uniqueIps' }, _id: 0 } },
        { $sort: { year: 1 } },
      ]),

      Visit.aggregate([
        { $match: { userId: { $ne: null } } },
        { $group: {
          _id: '$userId',
          visits: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
          pages: { $addToSet: '$page' },
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          visits: 1,
          lastVisit: 1,
          pageCount: { $size: '$pages' },
        }},
        { $sort: { visits: -1 } },
        { $limit: 100 },
      ]),
    ]);

    res.json({ summary: { total, today, thisMonth, thisYear, loggedIn, anonymous }, daily, monthly, yearly, userVisits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { recordVisit, getStats };
