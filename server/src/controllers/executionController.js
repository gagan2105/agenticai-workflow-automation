const executionService = require('../services/executionService');

const list = async (req, res, next) => {
  try {
    const result = await executionService.listExecutions(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const execution = await executionService.getExecution(req.params.id);
    if (!execution) return res.status(404).json({ success: false, message: 'Execution not found' });
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const getTimeline = async (req, res, next) => {
  try {
    const logs = await executionService.getTimeline(req.params.id);
    res.json({ success: true, timeline: logs });
  } catch (err) { next(err); }
};

const pause = async (req, res, next) => {
  try {
    const execution = await executionService.updateExecution(req.params.id, { status: 'PAUSED' });
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const resume = async (req, res, next) => {
  try {
    const execution = await executionService.updateExecution(req.params.id, { status: 'RUNNING' });
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const execution = await executionService.updateExecution(req.params.id, { status: 'CANCELLED', completedAt: new Date() });
    res.json({ success: true, execution });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, getTimeline, pause, resume, cancel };
