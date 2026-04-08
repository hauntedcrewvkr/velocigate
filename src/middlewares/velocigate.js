import { checkSlidingWindow } from '../utils/slidingWindow.js';
import { LogModel, BanModel } from '../models/models.js';

export const velocigate = (options = {}) => {
  return async (req, res, next) => {
    const ip = req.ip || '0.0.0.0';
    const user = req.user?.id || 'anonymous';
    const endpoint = req.path;
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const activeBan = await BanModel.findOne({ id: ip, expiresAt: { $gt: new Date() } });
      if (activeBan) {
        const remaining = Math.ceil((activeBan.expiresAt - new Date()) / 1000);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your IP is temporarily banned.',
          bannedUntil: activeBan.expiresAt,
          retryAfterSeconds: remaining
        });
      }

      const limit = 30;
      const window = 60;

      const { success } = await checkSlidingWindow({
        ip,
        limit,
        windowSizeInSeconds: window
      });

      const status = success ? 200 : 429;
      try {
        await LogModel.create({ ip, user, endpoint, status, userAgent });
      } catch (logErr) {
        console.error('Log error:', logErr);
      }

      if (!success) {
        const previousBansCount = await BanModel.countDocuments({ id: ip });
        
        // Tiered ban duration: 1m for first violation, 5m for subsequent
        let banDurationMinutes = previousBansCount === 0 ? 1 : 5;
        const expiresAt = new Date(Date.now() + banDurationMinutes * 60 * 1000);

        await BanModel.create({
          id: ip,
          type: 'ip',
          reason: `Strict limit exceeded (30 req/min). Violation #${previousBansCount + 1}`,
          expiresAt: expiresAt
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Limit exceeded. You are banned for ${banDurationMinutes} minute(s).`,
          bannedUntil: expiresAt,
          retryAfter: banDurationMinutes * 60
        });
      }

      next();
    } catch (error) {
      console.error('Velocigate middleware error:', error);
      next();
    }
  };
};
