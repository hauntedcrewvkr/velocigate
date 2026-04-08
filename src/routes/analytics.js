import { Router } from 'express';
import { LogModel, BanModel } from '../models/models.js';
import cache from '../config/cache.js';

const router = Router();

router.get('/stats', async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();
  
  try {
    const [counts, topIps, activeBansCount, activeBansList] = await Promise.all([
      LogModel.aggregate([
        { $match: { timestamp: { $gt: last24h } } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            blocked: { $sum: { $cond: [{ $eq: ['$status', 429] }, 1, 0] } }
        }}
      ]),
      LogModel.aggregate([
        { $match: { timestamp: { $gt: last24h } } },
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      BanModel.countDocuments({ expiresAt: { $gt: now } }),
      BanModel.find({ expiresAt: { $gt: now } }).sort({ expiresAt: -1 }).limit(10)
    ]);

    const stats = counts[0] || { total: 0, blocked: 0 };

    res.json({
      totalRequests24h: stats.total,
      blockedRequests24h: stats.blocked,
      topOffenders: topIps,
      activeBans: activeBansCount,
      activeBansList
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/usage', async (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

router.post('/clear', async (req, res) => {
  try {
    cache.flushAll();
    await Promise.all([
      LogModel.deleteMany({}),
      BanModel.deleteMany({})
    ]);
    res.json({ message: 'All logs, bans, and cache cleared successfully' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

export default router;
