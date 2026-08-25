const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
    executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
      required: true,
    },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1, default: 1.0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
