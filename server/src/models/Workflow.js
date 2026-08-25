const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, default: 'default' },
    position: { x: Number, y: Number },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, default: 'smoothstep' },
    animated: { type: Boolean, default: true },
    label: String,
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
    triggerConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    version: { type: Number, default: 1 },
    tags: [String],
    lastExecutedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workflow', workflowSchema);
