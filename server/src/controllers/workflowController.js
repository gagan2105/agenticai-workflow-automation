const workflowService = require('../services/workflowService');
const aiService = require('../services/aiGenerationService');
const executionService = require('../services/executionService');
const orchestrator = require('../agents/orchestrator');

const getDashboard = async (req, res, next) => {
  try {
    const metrics = await workflowService.getDashboardMetrics(req.user.id);
    res.json({ success: true, ...metrics });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const result = await workflowService.listWorkflows(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.user.id, req.body);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
};

const generate = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const generated = await aiService.generateWorkflow(prompt);
    res.json({ success: true, workflow: generated });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user.id);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.user.id, req.body);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
};

const duplicate = async (req, res, next) => {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user.id);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
};

const execute = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user.id);
    const wfData = workflow.toObject ? workflow.toObject() : workflow;
    const execution = await executionService.createExecution({
      workflowId: req.params.id,
      workflowSnapshot: wfData,
      triggeredBy: req.user.id,
      input: req.body.input || {},
    });

    // Run orchestration asynchronously — response returns immediately
    setImmediate(async () => {
      try {
        const integrationService = require('../services/integrationService');
        const integrationContext = await integrationService.getIntegrationContext(req.user.id);
        orchestrator.runOrchestration({
          execution,
          workflow: wfData,
          ownerId: req.user.id,
          integrationContext,
        }).catch(console.error);
      } catch (e) {
        console.error('Orchestration setup error:', e);
      }
    });

    res.status(202).json({ success: true, executionId: execution.id || execution._id, langGraph: orchestrator.langGraphStatus });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.user.id);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, list, create, generate, getOne, update, duplicate, execute, remove };
