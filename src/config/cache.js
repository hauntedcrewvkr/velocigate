import NodeCache from 'node-cache';

const nodeCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

console.log('✅ In-memory Cache Initialized');

const cache = {
  get: (key) => nodeCache.get(key),
  set: (key, value, ttl) => nodeCache.set(key, value, ttl),
  flushAll: () => {
    nodeCache.flushAll();
    console.log('🧹 Cache cleared');
  }
};

export default cache;
