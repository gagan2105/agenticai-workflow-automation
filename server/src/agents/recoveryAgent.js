/**
 * Recovery Agent
 * Classifies failures and decides: retry_with_backoff | escalate
 *
 * Escalation guard (spec requirement):
 * Any error containing INTEGRATION_NOT_CONNECTED, MISSING_CREDENTIAL,
 * PERMISSION_DENIED, SERVICE_DISABLED, or accessNotConfigured must
 * escalate immediately — never retry.
 */

const ESCALATE_IMMEDIATELY = [
  'INTEGRATION_NOT_CONNECTED',
  'MISSING_CREDENTIAL',
  'PERMISSION_DENIED',
  'SERVICE_DISABLED',
  'accessNotConfigured',
  'AUTH_EXPIRED',
];

const FAILURE_CLASSES = {
  MISSING_FIELDS: ['MISSING_FIELDS', 'required config field', 'missing'],
  API_FAILURE: ['500', 'API error', 'upstream', 'server error'],
  AUTH_EXPIRED: ['401', '403', 'unauthorized', 'forbidden', 'token expired', 'AUTH_EXPIRED'],
  RATE_LIMIT: ['429', 'rate limit', 'too many requests'],
  TRANSIENT: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'network', 'timeout'],
};

const classifyError = (errorMessage = '') => {
  const msg = String(errorMessage).toLowerCase();

  // Escalation guard — check before any retry logic
  if (ESCALATE_IMMEDIATELY.some((kw) => errorMessage.includes(kw))) {
    return { classification: 'INTEGRATION_NOT_CONNECTED', action: 'escalate' };
  }

  for (const [cls, patterns] of Object.entries(FAILURE_CLASSES)) {
    if (patterns.some((p) => msg.includes(p.toLowerCase()))) {
      const action = cls === 'MISSING_FIELDS' ? 'escalate' : 'retry_with_backoff';
      return { classification: cls, action };
    }
  }

  return { classification: 'TRANSIENT', action: 'retry_with_backoff' };
};

const getBackoffDelay = (retryCount) => Math.min(1000 * 2 ** retryCount, 30000);

module.exports = { classifyError, getBackoffDelay };
