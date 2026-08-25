import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Zap, Brain, Workflow, Play, ArrowRight, Check, Shield, Globe } from 'lucide-react';
import useAuthStore from '../store/authStore';

const FEATURES = [
  { icon: Brain, title: 'AI Workflow Generation', description: 'Describe your automation in plain English. Our AI converts it to a visual workflow graph instantly.', color: '#6366f1' },
  { icon: Workflow, title: 'Visual Workflow Builder', description: 'Drag-and-drop nodes on a React Flow canvas. Connect triggers, actions, and AI nodes intuitively.', color: '#8b5cf6' },
  { icon: Play, title: 'Multi-Agent Orchestration', description: 'Planner, Executor, Validator, Recovery, and Monitor agents cooperate to execute workflows reliably.', color: '#06b6d4' },
  { icon: Shield, title: 'Real-Time Observability', description: 'Watch every agent event stream live in your browser. Full audit trail persisted in MongoDB.', color: '#10b981' },
  { icon: Globe, title: 'OAuth Integrations', description: 'Connect Gmail, Slack, Discord, and Google Sheets with encrypted credential management.', color: '#f59e0b' },
  { icon: Zap, title: 'Auto-Recovery & Retry', description: 'Intelligent failure classification with automatic backoff retries or escalation when needed.', color: '#ef4444' },
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated]);

  return (
    <>
      <Head>
        <title>Agentflow AI — AI-Powered Workflow Automation Platform</title>
        <meta name="description" content="Build, visualize, and execute AI-powered automations. Connect your tools, describe your workflow, and let multi-agent orchestration handle the rest." />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--surface)', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'fixed', top: '-20%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Agentflow <span className="gradient-text">AI</span></span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/login"><button className="btn-ghost">Sign in</button></Link>
            <Link href="/register"><button className="btn-primary">Get Started <ArrowRight size={14} /></button></Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '5rem 2rem 4rem', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: '0.35rem 0.9rem', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '1.75rem', fontWeight: 500 }}>
            <Zap size={13} /> AI-Powered Automation Platform
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Build Automations with<br /><span className="gradient-text">Agentic AI Orchestration</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 2.5rem' }}>
            Describe your workflow in plain English. Watch AI generate a visual graph, then execute it through a chain of cooperating AI agents — live, observable, and fault-tolerant.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register">
              <button className="btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
                Start Building <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/login">
              <button className="btn-ghost" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
                Sign In
              </button>
            </Link>
          </div>
        </section>

        {/* Agent chain visualization */}
        <section style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: 900, margin: '0 auto 4rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Multi-Agent Execution Chain</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Planner', color: '#6366f1', badge: 'badge-planner' },
                { label: '→', color: 'var(--text-muted)', nobadge: true },
                { label: 'Executor', color: '#06b6d4', badge: 'badge-execution' },
                { label: '→', color: 'var(--text-muted)', nobadge: true },
                { label: 'Validator', color: '#10b981', badge: 'badge-validation' },
                { label: '→', color: 'var(--text-muted)', nobadge: true },
                { label: 'Recovery', color: '#f59e0b', badge: 'badge-recovery' },
                { label: '→', color: 'var(--text-muted)', nobadge: true },
                { label: 'Monitor', color: '#8b5cf6', badge: 'badge-monitoring' },
              ].map((item, i) => item.nobadge ? (
                <span key={i} style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>→</span>
              ) : (
                <span key={i} className={`badge ${item.badge}`} style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>{item.label}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, marginBottom: '0.75rem' }}>Everything You Need</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>A complete agentic automation platform, production-ready out of the box.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ position: 'relative', zIndex: 1, padding: '3rem 2rem 5rem', textAlign: 'center' }}>
          <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to automate your workflows?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>Join operators using Agentflow AI to build reliable, observable automations in minutes.</p>
            <Link href="/register">
              <button className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
                Get Started Free <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
