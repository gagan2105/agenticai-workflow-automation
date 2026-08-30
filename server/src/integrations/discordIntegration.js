const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class DiscordIntegration extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.accessToken = config.accessToken;
  }

  static getAuthUrl(clientId, redirectUri) {
    const scopes = ['identify', 'connections', 'guilds.join'];
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}`;
  }

  static async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post('https://discord.com/api/v10/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  async postMessage({ channelId, message }) {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: discord'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    try {
      // Send message to discord channel using access token
      const response = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { content: message || 'Hello from Agentflow!' },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        posted: true,
        id: response.data.id,
        channelId: response.data.channel_id,
        message: response.data.content
      };
    } catch (err) {
      if (err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: discord'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Discord post failed: ${err.response?.data?.message || err.message}`);
    }
  }
}

module.exports = DiscordIntegration;
