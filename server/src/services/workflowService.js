const { v4: uuidv4 } = require('uuid');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const { isUsingInMemory, getInMemoryStore } = require('../config/db');

// ─── Helper: in-memory workflow ops ────────────────────────────────────────────

const findWorkflowInMemory = (store, id, ownerId) => {
  const wf = store.workflows.find((w) => w.id === id);
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  if (ownerId && wf.owner !== ownerId) { const e = new Error('Forbidden'); e.statusCode = 403; throw e; }
  return wf;
};

// ─── Dashboard metrics ──────────────────────────────────────────────────────────

const getDashboardMetrics = async (ownerId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const userWfs = store.workflows.filter((w) => w.owner === ownerId);
    const userExecs = store.executions.filter((e) => userWfs.map((w) => w.id).includes(e.workflowId));
    const completed = userExecs.filter((e) => e.status === 'COMPLETED').length;
    const successRate = userExecs.length ? Math.round((completed / userExecs.length) * 100) : 0;
    return {
      totalWorkflows: userWfs.length,
      activeWorkflows: userWfs.filter((w) => w.status === 'active').length,
      totalExecutions: userExecs.length,
      successRate,
      recentWorkflows: userWfs.slice(-5).reverse(),
      recentExecutions: userExecs.slice(-5).reverse(),
    };
  }

  const [total, active, executions, completed] = await Promise.all([
    Workflow.countDocuments({ owner: ownerId }),
    Workflow.countDocuments({ owner: ownerId, status: 'active' }),
    Execution.find({ triggeredBy: ownerId }).sort({ createdAt: -1 }).limit(5).lean(),
    Execution.countDocuments({ triggeredBy: ownerId, status: 'COMPLETED' }),
  ]);
  const totalExec = await Execution.countDocuments({ triggeredBy: ownerId });
  const successRate = totalExec ? Math.round((completed / totalExec) * 100) : 0;
  const recentWorkflows = await Workflow.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(5).lean();

  return { totalWorkflows: total, activeWorkflows: active, totalExecutions: totalExec, successRate, recentWorkflows, recentExecutions: executions };
};

// ─── CRUD ───────────────────────────────────────────────────────────────────────

const listWorkflows = async (ownerId, { page = 1, limit = 20, status, search } = {}) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    let wfs = store.workflows.filter((w) => w.owner === ownerId);
    if (status) wfs = wfs.filter((w) => w.status === status);
    if (search) wfs = wfs.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));
    const start = (page - 1) * limit;
    return { workflows: wfs.slice(start, start + Number(limit)), total: wfs.length };
  }

  const query = { owner: ownerId };
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Workflow.countDocuments(query),
  ]);
  return { workflows, total };
};

const createWorkflow = async (ownerId, data) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const wf = { id: uuidv4(), owner: ownerId, version: 1, status: 'draft', tags: [], nodes: [], edges: [], ...data, createdAt: new Date(), updatedAt: new Date() };
    store.workflows.push(wf);
    return wf;
  }
  return Workflow.create({ owner: ownerId, ...data });
};

const getWorkflow = async (id, ownerId) => {
  if (isUsingInMemory()) return findWorkflowInMemory(getInMemoryStore(), id, ownerId);
  const wf = await Workflow.findOne({ _id: id, owner: ownerId });
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  return wf;
};

const updateWorkflow = async (id, ownerId, data) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const wf = findWorkflowInMemory(store, id, ownerId);
    Object.assign(wf, data, { updatedAt: new Date(), version: (wf.version || 1) + 1 });
    return wf;
  }
  const wf = await Workflow.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { ...data, $inc: { version: 1 }, updatedAt: new Date() },
    { new: true }
  );
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  return wf;
};

const duplicateWorkflow = async (id, ownerId) => {
  const source = await getWorkflow(id, ownerId);
  const clone = {
    name: `${source.name} (Copy)`,
    description: source.description,
    nodes: source.nodes,
    edges: source.edges,
    triggerConfig: source.triggerConfig,
    tags: source.tags,
    status: 'draft',
  };
  return createWorkflow(ownerId, clone);
};

const deleteWorkflow = async (id, ownerId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const idx = store.workflows.findIndex((w) => w.id === id && w.owner === ownerId);
    if (idx === -1) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
    store.workflows.splice(idx, 1);
    return;
  }
  const result = await Workflow.deleteOne({ _id: id, owner: ownerId });
  if (!result.deletedCount) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
};

module.exports = { getDashboardMetrics, listWorkflows, createWorkflow, getWorkflow, updateWorkflow, duplicateWorkflow, deleteWorkflow };
