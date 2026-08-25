/**
 * Validation Agent
 * Verifies that required output fields are present after each node execution.
 */

const REQUIRED_FIELDS_BY_TYPE = {
  send_email: ['to'],
  send_slack_message: ['channel'],
  send_discord_message: ['channel'],
  append_google_sheet: ['spreadsheetId'],
  ai_text_generation: ['prompt'],
  ai_classification: ['prompt'],
  condition: ['field', 'operator', 'value'],
  http_request: ['url'],
};

const validateNode = (node, output) => {
  const { type, config = {} } = node.data || {};
  const required = REQUIRED_FIELDS_BY_TYPE[type] || [];
  const missing = required.filter((f) => config[f] == null || config[f] === '');

  if (missing.length > 0) {
    return {
      valid: false,
      issues: missing.map((f) => `MISSING_FIELDS: required config field "${f}" is missing`),
    };
  }

  if (!output || (typeof output === 'object' && output.error)) {
    return { valid: false, issues: ['Output indicates error or is empty'] };
  }

  return { valid: true, issues: [] };
};

module.exports = { validateNode };
