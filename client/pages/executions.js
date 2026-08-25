import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PlayCircle, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, Activity, Eye } from 'lucide-react';
import io from 'socket.io-client';

import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/axios';

const STATUS_COLOR = {
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  RUNNING: '#6366f1',
  PENDING: '#f59e0b',
  RETRYING: '#f59e0b',
  PAUSED: '#8892a4',
  CANCELLED: '#4a5568',
};

const AGENT_BADGE = {
  planner: 'badge-planner',
  execution: 'badge-execution',
  validation: 'badge-validation',
  recovery: 'badge-recovery',
  monitoring: 'badge-monitoring',
  orchestrator: 'badge-monitoring',
};

export default function Executions() {
  const router = useRouter();
  const { highlight } = router.query;
  const [executions, setExecutions] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize socket client
  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    setSocket(s);

    s.on('connect', () => console.log('[Socket] Connected'));
    s.on('agent:event', (event) => {
      // Append real-time event to active execution timeline
      if (selectedExec && (selectedExec.id === event.executionId || selectedExec._id === event.executionId)) {
        setTimeline((prev) => [...prev, {
          createdAt: event.timestamp,
          agent: event.agent,
          eventType: event.eventType,
          message: event.data.message,
          level: event.data.level || 'info',
        }]);
      }

      // Update item status in execution list
      setExecutions((prev) => prev.map((ex) => {
        const id = ex.id || ex._id;
        if (id === event.executionId) {
          return { ...ex, status: event.eventType === 'EXECUTION_COMPLETE' ? 'COMPLETED' : event.eventType === 'EXECUTION_FAILED' ? 'FAILED' : 'RUNNING' };
        }
        return ex;
      }));
    });

    return () => {
      s.disconnect();
    };
  }, [selectedExec]);

  // Load executions list
  const loadExecutions = async () => {
    try {
      const { data } = await api.get('/executions');
      setExecutions(data.executions || []);
      if (highlight) {
        const match = data.executions.find((e) => (e.id || e._id) === highlight);
        if (match) handleSelectExec(match);
      } else if (data.executions.length > 0 && !selectedExec) {
        handleSelectExec(data.executions[0]);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [highlight]);

  const handleSelectExec = async (exec) => {
    setSelectedExec(exec);
    const id = exec.id || exec._id;
    if (socket) {
      socket.emit('subscribe:execution', id);
    }
    try {
      const { data } = await api.get(`/executions/${id}/timeline`);
      setTimeline(data.timeline || []);
    } catch {
      setTimeline([]);
    }
  };

  const handleControl = async (action) => {
    if (!selectedExec) return;
    const id = selectedExec.id || selectedExec._id;
    try {
      const { data } = await api.post(`/executions/${id}/${action}`, {});
      setSelectedExec(data.execution);
      loadExecutions();
    } catch {
      alert(`Failed to ${action} execution`);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Workflow Executions — Agentflow AI</title>
      </Head>
      <AppShell>
        <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 110px)' }}>
          {/* List panel */}
          <div className="glass-card" style={{ width: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Executions History</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
              ) : executions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No execution logs yet</div>
              ) : (
                executions.map((ex) => {
                  const id = ex.id || ex._id;
                  const active = selectedExec && (selectedExec.id === id || selectedExec._id === id);
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectExec(ex)}
                      style={{
                        padding: '0.75rem', borderRadius: 10, cursor: 'pointer',
                        border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
                        background: active ? 'rgba(99,102,241,0.04)' : 'transparent',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[ex.status] || '#8892a4', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ex.workflowSnapshot?.name || 'Workflow Run'}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {new Date(ex.createdAt).toLocaleTimeString()} · {ex.duration ? `${ex.duration}ms` : 'running'}
                        </div>
                      </div>
                      <Eye size={14} color="var(--text-muted)" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details / Timeline panel */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedExec ? (
              <>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Run ID: {selectedExec.id || selectedExec._id}</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedExec.workflowSnapshot?.name}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge" style={{ background: `${STATUS_COLOR[selectedExec.status]}22`, color: STATUS_COLOR[selectedExec.status] }}>
                      {selectedExec.status}
                    </span>

                    {selectedExec.status === 'RUNNING' && (
                      <button className="btn-ghost" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleControl('pause')}>
                        Pause
                      </button>
                    )}
                    {selectedExec.status === 'PAUSED' && (
                      <button className="btn-ghost" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleControl('resume')}>
                        Resume
                      </button>
                    )}
                    {(selectedExec.status === 'RUNNING' || selectedExec.status === 'RETRYING') && (
                      <button className="btn-ghost" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleControl('cancel')}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Agent Execution Timeline
                  </div>

                  {timeline.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Waiting for agent timeline events...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                      {timeline.map((log, i) => (
                        <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {/* Dot indicator */}
                          <div style={{
                            position: 'absolute', left: -21, top: 4, width: 9, height: 9, borderRadius: '50%',
                            background: log.level === 'error' ? '#ef4444' : log.level === 'success' ? '#10b981' : '#6366f1',
                          }} />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={`badge ${AGENT_BADGE[log.agent] || 'badge-planner'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                              {log.agent}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{log.eventType}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Select an execution to view details and timeline
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
