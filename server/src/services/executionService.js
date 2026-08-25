const { v4: uuidv4 } = require('uuid');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const { isUsingInMemory, getInMemoryStore } = require('../config/db');

const createExecution = async ({ workflowId, workflowSnapshot, triggeredBy, input = {} }) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const exec = {
      id: uuidv4(),
      workflowId,
      workflowSnapshot,
      status: 'PENDING',
      startedAt: new Date(),
      input,
      retryCount: 0,
      triggeredBy,
      createdAt: new Date(),
    };
    store.executions.push(exec);
    return exec;
  }
  return Execution.create({ workflowId, workflowSnapshot, triggeredBy, input, status: 'PENDING', startedAt: new Date() });
};

const updateExecution = async (execId, data) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const exec = store.executions.find((e) => e.id === execId);
    if (exec) Object.assign(exec, data);
    return exec;
  }
  return Execution.findByIdAndUpdate(execId, data, { new: true });
};

const getExecution = async (execId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    return store.executions.find((e) => e.id === execId) || null;
  }
  return Execution.findById(execId).lean();
};

const listExecutions = async (ownerId, { page = 1, limit = 20, status } = {}) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    let execs = store.executions.filter((e) => e.triggeredBy === ownerId);
    if (status) execs = execs.filter((e) => e.status === status);
    const start = (page - 1) * limit;
    return { executions: execs.slice(start, start + Number(limit)), total: execs.length };
  }
  const query = { triggeredBy: ownerId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [executions, total] = await Promise.all([
    Execution.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Execution.countDocuments(query),
  ]);
  return { executions, total };
};

const getTimeline = async (execId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    return store.executionLogs.filter((l) => l.executionId === execId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  return ExecutionLog.find({ executionId: execId }).sort({ createdAt: 1 }).lean();
};

const writeLog = async ({ executionId, workflowId, nodeId, agent, level, eventType, message, metadata }) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const log = { id: uuidv4(), executionId, workflowId, nodeId, agent, level: level || 'info', eventType, message, metadata, createdAt: new Date() };
    store.executionLogs.push(log);
    return log;
  }
  return ExecutionLog.create({ executionId, workflowId, nodeId, agent, level, eventType, message, metadata });
};

module.exports = { createExecution, updateExecution, getExecution, listExecutions, getTimeline, writeLog };
