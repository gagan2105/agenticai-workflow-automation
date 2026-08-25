const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema(
  {
    executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    nodeId: { type: String },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
    },
    level: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
    eventType: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
