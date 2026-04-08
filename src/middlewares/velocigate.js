import { checkSlidingWindow } from '../utils/slidingWindow.js';
import { LogModel, BanModel } from '../models/models.js';

// Local, ephemeral cache to make "Allowed" users feel instant
const localBanCache = new Map();

export const velocigate = (options = {}) => {
  return async (req, res, next) => {
    const ip = req.ip || '0.0.0.0';
    const user = req.user?.id || 'anonymous';
    const endpoint = req.path;
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      // 1. Check local "Allowed" cache first (Instant)
      const cached = localBanCache.get(ip);
      if (cached && cached.expiresAt > Date.now()) {
        // Skip DB ban check
      } else {
        // 2. Hit DB for active bans (Slow path, cached for 10s if not banned)
        const activeBan = await BanModel.findOne({ id: ip, expiresAt: { $gt: new Date() } }).lean();
        if (activeBan) {
          const remaining = Math.ceil((activeBan.expiresAt - new Date()) / 1000);
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Your IP is temporarily banned.',
            bannedUntil: activeBan.expiresAt,
            retryAfterSeconds: remaining
          });
        }
        // Cache that this user is "Good" for 10 seconds to avoid DB hits
        localBanCache.set(ip, { expiresAt: Date.now() + 10000 });
      }

      const limit = 30;
      const window = 60;

      const { success } = await checkSlidingWindow({
        ip,
        limit,
        windowSizeInSeconds: window
      });

      const status = success ? 200 : 429;
      
      // 3. Fire-and-forget logging (Async - DOES NOT wait for DB)
      LogModel.create({ ip, user, endpoint, status, userAgent }).catch(err => console.error('Log error:', err));

      if (!success) {
        // Remove from local "Good" cache since they are now being rate-limited
        localBanCache.delete(ip);
        
        const previousBansCount = await BanModel.countDocuments({ id: ip });
        
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
