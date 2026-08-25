const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    workflowSnapshot: { type: mongoose.Schema.Types.Mixed }, // immutable snapshot at run time
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    duration: { type: Number }, // ms
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', executionSchema);
