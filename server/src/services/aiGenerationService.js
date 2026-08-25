/**
 * AI Workflow Generation Service
 * Priority: OpenRouter → Gemini → Deterministic Rule-Based Builder
 */

const { OPENROUTER_API_KEY, GEMINI_API_KEY } = require('../config/env');
const axios = require('axios');

// ─── Node catalog ───────────────────────────────────────────────────────────────

const NODE_CATALOG = {
  triggers: ['manual_trigger', 'webhook_trigger', 'schedule_trigger'],
  actions: ['send_email', 'send_slack_message', 'send_discord_message', 'append_google_sheet', 'http_request'],
  ai: ['ai_text_generation', 'ai_classification', 'ai_summarization'],
  logic: ['condition', 'delay', 'loop', 'merge'],
};

// ─── Deterministic rule-based builder ──────────────────────────────────────────

const buildDeterministicWorkflow = (prompt) => {
  const lower = prompt.toLowerCase();

  let nodes = [];
  let edges = [];

  // Always start with a manual trigger
  const trigger = { id: 'node_trigger', type: 'triggerNode', position: { x: 100, y: 200 }, data: { label: 'Manual Trigger', type: 'manual_trigger', config: {} } };
  nodes.push(trigger);

  const addNode = (id, type, label, config, x, y) => {
    nodes.push({ id, type: 'actionNode', position: { x, y }, data: { label, type, config } });
  };
  const addEdge = (source, target, label = '') => {
    edges.push({ id: `e_${source}_${target}`, source, target, type: 'smoothstep', animated: true, label });
  };

  if (lower.includes('email') || lower.includes('gmail')) {
    addNode('node_email', 'send_email', 'Send Email', {
      to: lower.match(/to\s+([^\s,]+@[^\s,]+)/)?.[1] || '{{input.to}}',
      subject: 'Automated Email from Agentflow',
      body: '{{input.body}}',
    }, 400, 200);
    addEdge('node_trigger', 'node_email');

    if (lower.includes('slack')) {
      addNode('node_slack', 'send_slack_message', 'Send Slack Message', { channel: '#general', message: 'Email sent ✅' }, 700, 200);
      addEdge('node_email', 'node_slack');
    }
  } else if (lower.includes('slack')) {
    addNode('node_slack', 'send_slack_message', 'Send Slack Message', { channel: '#general', message: '{{input.message}}' }, 400, 200);
    addEdge('node_trigger', 'node_slack');
  } else if (lower.includes('discord')) {
    addNode('node_discord', 'send_discord_message', 'Send Discord Message', { channel: 'general', message: '{{input.message}}' }, 400, 200);
    addEdge('node_trigger', 'node_discord');
  } else if (lower.includes('sheet') || lower.includes('google sheet')) {
    addNode('node_sheet', 'append_google_sheet', 'Append to Google Sheet', { spreadsheetId: '{{input.spreadsheetId}}', range: 'A1', values: ['{{input.row}}'] }, 400, 200);
    addEdge('node_trigger', 'node_sheet');
  } else if (lower.includes('invoice') || lower.includes('routing')) {
    addNode('node_classify', 'ai_classification', 'Classify Invoice', { prompt: 'Classify this invoice: {{input.text}}' }, 400, 100);
    addNode('node_approve', 'send_email', 'Send Approval Email', { to: '{{input.approverEmail}}', subject: 'Invoice Approved', body: 'Invoice has been approved.' }, 700, 50);
    addNode('node_reject', 'send_email', 'Send Rejection Email', { to: '{{input.requesterEmail}}', subject: 'Invoice Rejected', body: 'Invoice has been rejected.' }, 700, 200);
    const cond = { id: 'node_condition', type: 'logicNode', position: { x: 550, y: 130 }, data: { label: 'Approval Check', type: 'condition', config: { field: 'classification', operator: 'equals', value: 'approved' } } };
    nodes.push(cond);
    addEdge('node_trigger', 'node_classify');
    addEdge('node_classify', 'node_condition');
    addEdge('node_condition', 'node_approve', 'true');
    addEdge('node_condition', 'node_reject', 'false');
  } else {
    // Generic AI generation fallback
    addNode('node_ai', 'ai_text_generation', 'Generate Content', { prompt: `${prompt}\n\nInput: {{input.data}}` }, 400, 200);
    addEdge('node_trigger', 'node_ai');
  }

  return {
    name: `Workflow: ${prompt.slice(0, 40)}`,
    description: prompt,
    nodes,
    edges,
    triggerConfig: { type: 'manual_trigger' },
    tags: ['ai-generated'],
  };
};

// ─── OpenRouter generation ──────────────────────────────────────────────────────

const generateWithOpenRouter = async (prompt) => {
  const systemPrompt = `You are an AI workflow generator. Given a user prompt, output a JSON workflow for a no-code automation platform.
Return ONLY valid JSON in this exact format:
{
  "name": "string",
  "description": "string",
  "nodes": [{"id":"string","type":"string","position":{"x":number,"y":number},"data":{"label":"string","type":"string","config":{}}}],
  "edges": [{"id":"string","source":"string","target":"string","type":"smoothstep","animated":true}],
  "triggerConfig": {},
  "tags": []
}
Available node types: ${JSON.stringify(NODE_CATALOG)}
Position nodes left to right, starting at x=100, with y=200 for linear flows.`;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a workflow for: ${prompt}` },
      ],
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('OpenRouter returned non-JSON response');
  return JSON.parse(jsonMatch[0]);
};

// ─── Gemini generation ──────────────────────────────────────────────────────────

const generateWithGemini = async (prompt) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const systemPrompt = `You are an AI workflow generator. Return ONLY valid JSON for a workflow automation. 
Available node types: ${JSON.stringify(NODE_CATALOG)}.
Format: {"name":"string","description":"string","nodes":[...],"edges":[...],"triggerConfig":{},"tags":[]}`;

  const result = await model.generateContent(`${systemPrompt}\n\nUser prompt: ${prompt}`);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned non-JSON response');
  return JSON.parse(jsonMatch[0]);
};

// ─── Main export ────────────────────────────────────────────────────────────────

const generateWorkflow = async (prompt) => {
  let provider = 'deterministic';
  let workflow;

  if (OPENROUTER_API_KEY) {
    try {
      workflow = await generateWithOpenRouter(prompt);
      provider = 'openrouter';
    } catch (err) {
      console.warn('[AI Gen] OpenRouter failed, falling back:', err.message);
    }
  }

  if (!workflow && GEMINI_API_KEY) {
    try {
      workflow = await generateWithGemini(prompt);
      provider = 'gemini';
    } catch (err) {
      console.warn('[AI Gen] Gemini failed, falling back:', err.message);
    }
  }

  if (!workflow) {
    workflow = buildDeterministicWorkflow(prompt);
    provider = 'deterministic';
  }

  return { ...workflow, _generatedBy: provider };
};

module.exports = { generateWorkflow };
