/**
 * Monitoring Agent
 * Emits structured timeline events for each agent step.
 * Integrates with Socket.IO and ExecutionLog persistence.
 */

const { emitAgentEvent } = require('../config/socket');
const { writeLog } = require('../services/executionService');

const emit = async ({ executionId, workflowId, nodeId, agent, eventType, level, message, metadata }) => {
  // Emit real-time Socket.IO event
  try {
    emitAgentEvent(executionId, agent, eventType, { nodeId, message, metadata, level });
  } catch {
    // Socket may not be initialized in test/CLI runs
  }

  // Persist to ExecutionLog
  try {
    await writeLog({ executionId, workflowId, nodeId, agent, level: level || 'info', eventType, message, metadata });
  } catch (err) {
    console.error('[MonitoringAgent] Failed to write log:', err.message);
  }
};

module.exports = { emit };
