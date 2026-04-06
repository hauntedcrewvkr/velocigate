import cache from '../config/cache.js';

export const checkSlidingWindow = async ({
  windowSizeInSeconds,
  limit,
  key,
}) => {
  const now = Date.now();
  const windowStart = now - windowSizeInSeconds * 1000;

  let timestamps = cache.get(key) || [];

  // Filter old timestamps and add current
  timestamps = timestamps.filter(ts => ts > windowStart);
  timestamps.push(now);

  cache.set(key, timestamps, windowSizeInSeconds + 5);

  const count = timestamps.length;

  return { 
    success: count <= limit, 
    current: count, 
    limit 
  };
};
