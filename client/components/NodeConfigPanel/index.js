import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const FIELD_SCHEMAS = {
  send_email: [
    { key: 'to', label: 'To (email)', type: 'text', placeholder: 'recipient@example.com' },
    { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email body…' },
  ],
  send_slack_message: [
    { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
    { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Slack message…' },
  ],
  send_discord_message: [
    { key: 'channel', label: 'Channel', type: 'text', placeholder: 'channel-name' },
    { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Discord message…' },
  ],
  append_google_sheet: [
    { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'Google Sheet ID' },
    { key: 'range', label: 'Range', type: 'text', placeholder: 'A1' },
  ],
  ai_text_generation: [
    { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'AI prompt…' },
  ],
  ai_classification: [
    { key: 'prompt', label: 'Classification prompt', type: 'textarea', placeholder: 'Classify: {{input.text}}' },
  ],
  ai_summarization: [
    { key: 'prompt', label: 'Summarize prompt', type: 'textarea', placeholder: 'Summarize: {{input.text}}' },
  ],
  condition: [
    { key: 'field', label: 'Field', type: 'text', placeholder: 'input field name' },
    { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'contains', 'gt', 'lt'] },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'compare value' },
  ],
  delay: [
    { key: 'delayMs', label: 'Delay (ms)', type: 'number', placeholder: '1000' },
  ],
  http_request: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/endpoint' },
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  ],
};

export default function NodeConfigPanel({ node, onChange, onClose }) {
  const [config, setConfig] = useState(node?.data?.config || {});
  const [label, setLabel] = useState(node?.data?.label || '');

  useEffect(() => {
    setConfig(node?.data?.config || {});
    setLabel(node?.data?.label || '');
  }, [node?.id]);

  if (!node) {
    return (
      <div style={{ width: 280, background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem', textAlign: 'center' }}>
        Click a node to configure it
      </div>
    );
  }

  const fields = FIELD_SCHEMAS[node.data?.type] || [];

  const handleSave = () => {
    onChange({ ...node, data: { ...node.data, label, config } });
  };

  return (
    <div style={{ width: 280, background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Node Config</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{node.data?.type}</div>
        </div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>Node Label</label>
          <input className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Node label" />
        </div>

        {fields.map((field) => (
          <div key={field.key}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                className="input-field"
                style={{ resize: 'vertical', minHeight: 80 }}
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            ) : field.type === 'select' ? (
              <select
                className="input-field"
                value={config[field.key] || field.options[0]}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
              >
                {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                className="input-field"
                type={field.type}
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave}>
          <Save size={14} /> Apply Changes
        </button>
      </div>
    </div>
  );
}
