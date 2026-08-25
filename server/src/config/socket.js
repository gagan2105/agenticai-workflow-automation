const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === CLIENT_URL ||
          origin.startsWith('http://localhost') ||
          /\.vercel\.app$/.test(origin) ||
          /\.up\.railway\.app$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error(`Socket CORS: origin ${origin} not allowed`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client subscribes to a specific execution room
    socket.on('subscribe:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      console.log(`[Socket.IO] ${socket.id} subscribed to execution:${executionId}`);
    });

    socket.on('unsubscribe:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

/**
 * Emit an agent event to all clients subscribed to the given execution room.
 * @param {string} executionId
 * @param {string} agent - planner | execution | validation | recovery | monitoring
 * @param {string} eventType
 * @param {object} data
 */
const emitAgentEvent = (executionId, agent, eventType, data = {}) => {
  if (!io) return; // graceful no-op if socket not ready
  io.to(`execution:${executionId}`).emit('agent:event', {
    executionId,
    agent,
    eventType,
    data,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { initSocket, getIO, emitAgentEvent };
