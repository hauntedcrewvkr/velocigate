import { LogModel } from '../models/models.js';

export const checkSlidingWindow = async ({
  windowSizeInSeconds,
  limit,
  ip,
}) => {
  const windowStart = new Date(Date.now() - windowSizeInSeconds * 1000);

  // Count existing logs in the window for this IP
  const count = await LogModel.countDocuments({ 
    ip, 
    timestamp: { $gt: windowStart } 
  });

  return { 
    success: count < limit, 
    current: count + 1, // Include the current request
    limit 
  };
};
