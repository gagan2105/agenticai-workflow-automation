const NODE_TYPES = [
  // Triggers
  { type: 'manual_trigger', label: 'Manual Trigger', group: 'Triggers', color: '#6366f1', description: 'Start workflow manually' },
  { type: 'webhook_trigger', label: 'Webhook', group: 'Triggers', color: '#6366f1', description: 'HTTP webhook trigger' },
  { type: 'schedule_trigger', label: 'Schedule', group: 'Triggers', color: '#6366f1', description: 'Cron-based trigger' },
  // Actions
  { type: 'send_email', label: 'Send Email', group: 'Actions', color: '#06b6d4', description: 'Send via Gmail' },
  { type: 'send_slack_message', label: 'Slack Message', group: 'Actions', color: '#06b6d4', description: 'Post to Slack channel' },
  { type: 'send_discord_message', label: 'Discord Message', group: 'Actions', color: '#06b6d4', description: 'Post to Discord' },
  { type: 'append_google_sheet', label: 'Append Sheet', group: 'Actions', color: '#06b6d4', description: 'Add row to Google Sheets' },
  { type: 'http_request', label: 'HTTP Request', group: 'Actions', color: '#06b6d4', description: 'Generic HTTP call' },
  // AI
  { type: 'ai_text_generation', label: 'AI Generate', group: 'AI Nodes', color: '#8b5cf6', description: 'Generate text with AI' },
  { type: 'ai_classification', label: 'AI Classify', group: 'AI Nodes', color: '#8b5cf6', description: 'Classify input with AI' },
  { type: 'ai_summarization', label: 'AI Summarize', group: 'AI Nodes', color: '#8b5cf6', description: 'Summarize text with AI' },
  // Logic
  { type: 'condition', label: 'Condition', group: 'Logic', color: '#f59e0b', description: 'Branch on condition' },
  { type: 'delay', label: 'Delay', group: 'Logic', color: '#f59e0b', description: 'Wait for N milliseconds' },
  { type: 'merge', label: 'Merge', group: 'Logic', color: '#f59e0b', description: 'Merge multiple paths' },
];

const GROUPS = ['Triggers', 'Actions', 'AI Nodes', 'Logic'];

export default function NodePalette({ onDragStart }) {
  return (
    <div style={{ width: 220, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, padding: '1rem 0.75rem', height: '100%' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>Node Palette</div>

      {GROUPS.map((group) => (
        <div key={group} style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.25rem', marginBottom: '0.4rem' }}>{group}</div>
          {NODE_TYPES.filter((n) => n.group === group).map((nodeType) => (
            <div
              key={nodeType.type}
              draggable
              onDragStart={(e) => onDragStart && onDragStart(e, nodeType)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.6rem', borderRadius: 8, marginBottom: '0.25rem',
                cursor: 'grab', border: '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              title={nodeType.description}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: nodeType.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 500, color: 'var(--text-primary)' }}>{nodeType.label}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{nodeType.description}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
