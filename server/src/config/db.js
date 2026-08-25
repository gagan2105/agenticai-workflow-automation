const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

// In-memory store fallback (used when MONGO_URI is not set)
const inMemoryStore = {
  users: [],
  workflows: [],
  executions: [],
  executionLogs: [],
  integrations: [],
  notifications: [],
  agentMemory: [],
};

let usingInMemory = false;

const connectDB = async () => {
  if (!MONGO_URI) {
    console.log('[DB] No MONGO_URI set — using in-memory store fallback');
    usingInMemory = true;
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    console.log('[DB] Falling back to in-memory store');
    usingInMemory = true;
  }
};

const isUsingInMemory = () => usingInMemory;
const getInMemoryStore = () => inMemoryStore;

module.exports = { connectDB, isUsingInMemory, getInMemoryStore };
