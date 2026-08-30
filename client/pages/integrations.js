import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Puzzle, Shield, Check, RefreshCw, Plus, Trash } from 'lucide-react';

import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/axios';

const INTEGRATIONS_CATALOG = [
  { provider: 'gmail', label: 'Gmail', icon: '✉️', description: 'Send and read mail' },
  { provider: 'slack', label: 'Slack', icon: '💬', description: 'Post messages to channels' },
  { provider: 'discord', label: 'Discord', icon: '👾', description: 'Post bot messages' },
  { provider: 'google-sheets', label: 'Google Sheets', icon: '📊', description: 'Append rows and read ranges' },
];

export default function Integrations() {
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/integrations/status');
      setConnections(data.status || {});
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (provider) => {
    try {
      const { data } = await api.get(`/integrations/oauth/${provider}/start`);
      if (data.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          data.authUrl,
          `Connect ${provider}`,
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
        );

        const timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer);
            fetchStatus();
          }
        }, 1000);
      }
    } catch {
      alert(`Failed to connect ${provider}`);
    }
  };

  const handleDisconnect = async (provider) => {
    try {
      // Disconnect by posting disconnected status
      await api.post('/integrations', {
        provider,
        status: 'disconnected',
      });
      fetchStatus();
    } catch {
      alert(`Failed to disconnect ${provider}`);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Third-Party Integrations — Agentflow AI</title>
      </Head>
      <AppShell>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Integrations
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Connect third-party tools to enable your AI execution agents to trigger actions or read data.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            {INTEGRATIONS_CATALOG.map((item) => {
              const status = connections[item.provider] || 'disconnected';
              const connected = status === 'connected';
              return (
                <div key={item.provider} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border)' }}>
                    {item.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</span>
                      <span className="badge" style={{
                        background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        color: connected ? '#10b981' : 'var(--text-muted)',
                        fontSize: '0.65rem',
                      }}>
                        {status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>

                  <div>
                    {connected ? (
                      <button className="btn-ghost" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDisconnect(item.provider)}>
                        Disconnect
                      </button>
                    ) : (
                      <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleConnect(item.provider)}>
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={16} color="#10b981" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              All OAuth access and refresh credentials are encrypted at rest using AES-256 with the application-level key.
            </span>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
