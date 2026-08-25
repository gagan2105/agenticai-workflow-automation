import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Custom node components ────────────────────────────────────────────────────

const NODE_COLORS = {
  manual_trigger: '#6366f1',
  webhook_trigger: '#6366f1',
  schedule_trigger: '#6366f1',
  send_email: '#06b6d4',
  send_slack_message: '#06b6d4',
  send_discord_message: '#06b6d4',
  append_google_sheet: '#06b6d4',
  http_request: '#06b6d4',
  ai_text_generation: '#8b5cf6',
  ai_classification: '#8b5cf6',
  ai_summarization: '#8b5cf6',
  condition: '#f59e0b',
  delay: '#f59e0b',
  merge: '#f59e0b',
};

const CustomNode = ({ data, selected }) => {
  const color = NODE_COLORS[data.type] || '#6366f1';
  return (
    <div style={{
      background: 'var(--surface-3)',
      border: `2px solid ${selected ? color : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      padding: '0.75rem 1rem',
      minWidth: 150,
      boxShadow: selected ? `0 0 0 3px ${color}33` : '0 4px 16px rgba(0,0,0,0.3)',
      transition: 'all 0.15s',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 10, height: 10, border: '2px solid var(--surface)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.7rem', color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{data.type?.replace(/_/g, ' ')}</span>
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data.label}</div>

      <Handle type="source" position={Position.Right} style={{ background: color, width: 10, height: 10, border: '2px solid var(--surface)' }} />
    </div>
  );
};

const TriggerNode = (props) => <CustomNode {...props} />;
const ActionNode = (props) => <CustomNode {...props} />;
const LogicNode = (props) => <CustomNode {...props} />;

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  logicNode: LogicNode,
  default: CustomNode,
};

// ─── WorkflowCanvas ────────────────────────────────────────────────────────────

export default function WorkflowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onDrop, onDragOver }) {

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
  }), []);

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        style={{ background: 'var(--surface-2)' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.05)" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.type] || '#6366f1'}
          maskColor="rgba(0,0,0,0.5)"
          style={{ background: 'var(--surface-3)', borderRadius: 10 }}
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', pointerEvents: 'none', gap: '0.5rem' }}>
          <div style={{ fontSize: '2rem' }}>⚡</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Drag nodes from the palette or generate with AI</div>
          <div style={{ fontSize: '0.8rem' }}>Click the palette on the left to get started</div>
        </div>
      )}
    </div>
  );
}
