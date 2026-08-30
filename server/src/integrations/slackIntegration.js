const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class SlackIntegration extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.accessToken = config.accessToken;
  }

  static getAuthUrl(clientId, redirectUri) {
    const scopes = ['chat:write', 'channels:read', 'chat:write.public'];
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(','))}`;
  }

  static async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post('https://slack.com/api/oauth.v2.access', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    if (!response.data.ok) {
      throw new Error(`Slack OAuth exchange failed: ${response.data.error}`);
    }

    return {
      accessToken: response.data.access_token,
      teamName: response.data.team?.name,
      botUserId: response.data.bot_user_id
    };
  }

  async postMessage({ channel, text }) {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: slack'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel: channel || '#general', text: text || 'Hello from Agentflow!' },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json; charset=utf-8'
          },
          timeout: 15000
        }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      return {
        posted: true,
        ts: response.data.ts,
        channel: response.data.channel
      };
    } catch (err) {
      // Check for token issues
      const isTokenError = err.message === 'token_revoked' || err.message === 'not_authed' || err.message === 'invalid_auth';
      if (isTokenError || err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: slack'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Slack post failed: ${err.message}`);
    }
  }
}

module.exports = SlackIntegration;
