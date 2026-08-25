import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Workflow, PlayCircle, CheckCircle, TrendingUp, Clock, Zap, ArrowRight, Plus, Activity } from 'lucide-react';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import ProtectedRoute from '../components/ProtectedRoute';
import useAuthStore from '../store/authStore';
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

function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse" style={{ padding: '1rem' }}>
      <div style={{ height: 14, background: 'var(--surface-4)', borderRadius: 6, width: '60%', marginBottom: '0.75rem' }} />
      <div style={{ height: 32, background: 'var(--surface-4)', borderRadius: 6, width: '40%', marginBottom: '0.5rem' }} />
      <div style={{ height: 10, background: 'var(--surface-4)', borderRadius: 6, width: '70%' }} />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/workflows/dashboard');
        setMetrics(data);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const metricCards = [
    { title: 'Total Workflows', value: metrics?.totalWorkflows ?? 0, subtitle: 'All time', icon: Workflow, color: '#6366f1' },
    { title: 'Active Workflows', value: metrics?.activeWorkflows ?? 0, subtitle: 'Currently active', icon: Zap, color: '#10b981' },
    { title: 'Total Executions', value: metrics?.totalExecutions ?? 0, subtitle: 'All runs', icon: PlayCircle, color: '#06b6d4' },
    { title: 'Success Rate', value: metrics ? `${metrics.successRate}%` : '—', subtitle: 'Completed runs', icon: TrendingUp, color: '#f59e0b' },
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard — Agentflow AI</title>
        <meta name="description" content="Operator dashboard with workflow metrics and execution activity" />
      </Head>
      <AppShell>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Operator'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Here's what's happening with your automations</p>
          </div>
          <Link href="/workflows/builder">
            <button className="btn-primary" id="new-workflow-btn">
              <Plus size={15} /> New Workflow
            </button>
          </Link>
        </div>

        {/* Metrics */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <MetricGrid metrics={metricCards} />
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Recent Workflows */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Workflow size={16} color="#6366f1" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent Workflows</span>
              </div>
              <Link href="/workflows/builder" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '0.75rem', color: '#a5b4fc', cursor: 'pointer' }}>View all →</span>
              </Link>
            </div>
            {!metrics?.recentWorkflows?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Workflow size={28} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                No workflows yet
                <div style={{ marginTop: '0.75rem' }}>
                  <Link href="/workflows/builder">
                    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                      <Plus size={13} /> Create your first
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metrics.recentWorkflows.map((wf) => (
                  <Link key={wf.id || wf._id} href={`/workflows/${wf.id || wf._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={14} color="#6366f1" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wf.nodes?.length || 0} nodes · {wf.status}</div>
                      </div>
                      <ArrowRight size={14} color="var(--text-muted)" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Executions */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="#06b6d4" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent Executions</span>
              </div>
              <Link href="/executions" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '0.75rem', color: '#67e8f9', cursor: 'pointer' }}>View all →</span>
              </Link>
            </div>
            {!metrics?.recentExecutions?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <PlayCircle size={28} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                No executions yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metrics.recentExecutions.map((ex) => (
                  <Link key={ex.id || ex._id} href={`/executions`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.background = 'rgba(6,182,212,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[ex.status] || '#8892a4', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.workflowId?.name || 'Workflow run'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ex.status} · {ex.duration ? `${ex.duration}ms` : '—'}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: STATUS_COLOR[ex.status] || 'var(--text-muted)', fontWeight: 600 }}>{ex.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Activity feed placeholder */}
        <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Agent Activity</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['planner', 'execution', 'validation', 'recovery', 'monitoring'].map((agent) => (
              <span key={agent} className={`badge badge-${agent}`}>{agent}</span>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Run a workflow to see live agent activity here. Each agent emits real-time events streamed via Socket.IO.
          </p>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
