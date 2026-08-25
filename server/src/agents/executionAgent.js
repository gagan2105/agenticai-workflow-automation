/**
 * Execution Agent
 * Runs each node against the correct integration or AI provider.
 * Pure module — receives node + integrations context, returns output.
 */

const executeNode = async (node, { integrationContext = {}, input = {}, aiContext = {} } = {}) => {
  const { type, config = {} } = node.data || {};

  switch (type) {
    case 'manual_trigger':
    case 'webhook_trigger':
    case 'schedule_trigger':
      return { triggered: true, timestamp: new Date().toISOString(), input };

    case 'send_email': {
      const gmailClient = integrationContext.gmail;
      if (!gmailClient) throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: gmail'), { code: 'INTEGRATION_NOT_CONNECTED' });
      return gmailClient.sendEmail({ to: config.to, subject: config.subject, body: config.body, input });
    }

    case 'send_slack_message': {
      const slackClient = integrationContext.slack;
      if (!slackClient) throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: slack'), { code: 'INTEGRATION_NOT_CONNECTED' });
      return slackClient.postMessage({ channel: config.channel, text: config.message, input });
    }

    case 'send_discord_message': {
      const discordClient = integrationContext.discord;
      if (!discordClient) throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: discord'), { code: 'INTEGRATION_NOT_CONNECTED' });
      return discordClient.postMessage({ channelId: config.channel, message: config.message, input });
    }

    case 'append_google_sheet': {
      const sheetsClient = integrationContext['google-sheets'];
      if (!sheetsClient) throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: google-sheets'), { code: 'INTEGRATION_NOT_CONNECTED' });
      return sheetsClient.appendRow({ spreadsheetId: config.spreadsheetId, range: config.range, values: config.values, input });
    }

    case 'ai_text_generation':
    case 'ai_classification':
    case 'ai_summarization': {
      // Simulate AI call with mock output for Phase 3 (real call wired in Phase 5)
      const prompt = (config.prompt || '').replace('{{input.data}}', JSON.stringify(input));
      return { generated: `[AI output for: ${prompt.slice(0, 60)}]`, model: 'mock' };
    }

    case 'condition': {
      const { field, operator, value } = config;
      const actual = input[field];
      let result = false;
      if (operator === 'equals') result = actual == value; // eslint-disable-line eqeqeq
      if (operator === 'contains') result = String(actual).includes(value);
      if (operator === 'gt') result = Number(actual) > Number(value);
      if (operator === 'lt') result = Number(actual) < Number(value);
      return { conditionResult: result, field, actual };
    }

    case 'delay': {
      const ms = config.delayMs || 1000;
      await new Promise((r) => setTimeout(r, Math.min(ms, 5000)));
      return { delayed: ms };
    }

    case 'http_request': {
      const axios = require('axios');
      const response = await axios({ method: config.method || 'GET', url: config.url, data: config.body, headers: config.headers, timeout: 10000 });
      return { status: response.status, data: response.data };
    }

    default:
      return { skipped: true, reason: `Unknown node type: ${type}` };
  }
};

module.exports = { executeNode };
