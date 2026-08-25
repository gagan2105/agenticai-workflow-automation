import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function MetricCard({ title, value, subtitle, trend, color = '#6366f1', icon: Icon }) {
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#8892a4';

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {Icon && (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {trend !== undefined && <TrendIcon size={13} color={trendColor} />}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>
    </div>
  );
}

export default function MetricGrid({ metrics = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} />
      ))}
    </div>
  );
}
