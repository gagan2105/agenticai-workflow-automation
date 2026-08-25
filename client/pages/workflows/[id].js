import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { Play, Save, Settings, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../lib/axios';

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { currentWorkflow, setCurrentWorkflow, saveWorkflow, isLoading, error } = useWorkflowStore();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executing, setExecuting] = useState(false);

  // Load workflow data
  useEffect(() => {
    if (!id) return;
    const loadWorkflow = async () => {
      try {
        const { data } = await api.get(`/workflows/${id}`);
        setCurrentWorkflow(data.workflow);
        setNodes(data.workflow.nodes || []);
        setEdges(data.workflow.edges || []);
      } catch (err) {
        console.error('Failed to load workflow:', err);
      }
    };
    loadWorkflow();
  }, [id]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const nodeTypeData = event.dataTransfer.getData('application/reactflow');

      if (!nodeTypeData) return;

      const nodeType = JSON.parse(nodeTypeData);
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeType.type === 'condition' || nodeType.type === 'delay' || nodeType.type === 'merge' ? 'logicNode' : nodeType.group === 'Triggers' ? 'triggerNode' : 'actionNode',
        position,
        data: { label: nodeType.label, type: nodeType.type, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    []
  );

  const handleNodeConfigChange = (updatedNode) => {
    setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
    setSelectedNode(updatedNode);
  };

  const handleSave = async () => {
    if (!currentWorkflow) return;
    const finalWf = {
      ...currentWorkflow,
      nodes,
      edges,
    };
    await saveWorkflow(finalWf);
  };

  const handleExecute = async () => {
    if (!id) return;
    setExecuting(true);
    try {
      await handleSave();
      const { data } = await api.post(`/workflows/${id}/execute`, {});
      router.push(`/executions?highlight=${data.executionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Execution failed to trigger');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>{currentWorkflow?.name || 'Workflow Editor'} — Agentflow AI</title>
      </Head>
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', gap: '0.75rem' }}>
          {/* Editor Header / Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn-ghost" style={{ padding: '0.4rem 0.6rem' }} onClick={() => router.push('/dashboard')}>
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{currentWorkflow?.name || 'Loading Workflow...'}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{currentWorkflow?.description || 'No description'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-ghost" onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
              <button className="btn-primary" onClick={handleExecute} disabled={executing}>
                {executing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Execute
              </button>
            </div>
          </div>

          {/* Builder Canvas Area */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 14 }}>
            <NodePalette onDragStart={onDragStart} />

            <div style={{ flex: 1, height: '100%' }}>
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            </div>

            <NodeConfigPanel
              node={selectedNode}
              onChange={handleNodeConfigChange}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
