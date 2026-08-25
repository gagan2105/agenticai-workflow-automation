const Redis = require('ioredis');
const { REDIS_URL } = require('../config/env');

let redisClient = null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.error('[Redis] Connection failed, using fallback:', err.message);
  }
} else {
  console.log('[Redis] No REDIS_URL specified. In-memory mode active.');
}

module.exports = redisClient;
