import { Router } from 'express';
import { LogModel, BanModel } from '../models/models.js';
import cache from '../config/cache.js';

const router = Router();

router.get('/stats', async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const total = await LogModel.countDocuments({ timestamp: { $gt: last24h } });
  const blocked = await LogModel.countDocuments({ 
    timestamp: { $gt: last24h },
    status: 429 
  });
  
  const topIps = await LogModel.aggregate([
    { $match: { timestamp: { $gt: last24h } } },
    { $group: { _id: '$ip', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const activeBansCount = await BanModel.countDocuments({ expiresAt: { $gt: new Date() } });
  const activeBansList = await BanModel.find({ expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 }).limit(10);

  res.json({
    totalRequests24h: total,
    blockedRequests24h: blocked,
    topOffenders: topIps,
    activeBans: activeBansCount,
    activeBansList
  });
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
