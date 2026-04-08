import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  ip: { type: String },
  user: String,
  endpoint: String,
  timestamp: { type: Date, default: Date.now },
  status: Number,
  userAgent: String,
});

// Compound index for ultra-fast sliding window checks
LogSchema.index({ ip: 1, timestamp: -1 });
LogSchema.index({ timestamp: 1 }); // Still keep this for 24h cleanup/stats

export const LogModel = mongoose.model('Log', LogSchema);

const BanSchema = new mongoose.Schema({
  id: { type: String, index: true },
  type: { type: String, enum: ['ip', 'user'] },
  reason: String,
  expiresAt: { type: Date, index: true },
  timestamp: { type: Date, default: Date.now },
});

export const BanModel = mongoose.model('Ban', BanSchema);
