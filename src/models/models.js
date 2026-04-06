import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  ip: { type: String, index: true },
  user: String,
  endpoint: String,
  timestamp: { type: Date, default: Date.now, index: true },
  status: Number,
  userAgent: String,
});

export const LogModel = mongoose.model('Log', LogSchema);

const BanSchema = new mongoose.Schema({
  id: { type: String, index: true },
  type: { type: String, enum: ['ip', 'user'] },
  reason: String,
  expiresAt: { type: Date, index: true },
  timestamp: { type: Date, default: Date.now },
});

export const BanModel = mongoose.model('Ban', BanSchema);
