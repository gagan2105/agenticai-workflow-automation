import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Shield, Key, Bell, Sun, Moon } from 'lucide-react';

import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import useAuthStore from '../store/authStore';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Head>
        <title>Account Settings — Agentflow AI</title>
      </Head>
      <AppShell>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Settings
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage your user profile, configurations, and API key statuses.
            </p>
          </div>

          {/* Profile Details */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <User size={16} color="#6366f1" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>User Profile</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Name</label>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.email}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Platform Role</label>
                <span className="badge badge-planner" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                  {user?.role || 'operator'}
                </span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <Shield size={16} color="#10b981" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Security & API Status</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Credential Encryption Key Health</span>
                <span className="badge badge-success">Encrypted</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>OpenRouter API Integration</span>
                <span className="badge badge-warning">Available</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gemini API Integration</span>
                <span className="badge badge-warning">Available</span>
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>Sign Out Account</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disconnect this session from this browser.</span>
            </div>
            <button className="btn-ghost" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => { logout(); router.push('/login'); }}>
              Sign Out
            </button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
