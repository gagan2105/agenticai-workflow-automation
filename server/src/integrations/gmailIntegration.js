const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class GmailIntegration extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tokenExpiresAt = config.tokenExpiresAt;
  }

  static getAuthUrl(clientId, redirectUri) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;
  }

  static async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, { timeout: 10000 });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  async refreshAccessToken(clientId, clientSecret) {
    if (!this.refreshToken) {
      throw Object.assign(new Error('AUTH_EXPIRED: No refresh token available'), { code: 'AUTH_EXPIRED' });
    }
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      }, { timeout: 10000 });

      this.accessToken = response.data.access_token;
      if (response.data.expires_in) {
        this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      }
      return {
        accessToken: this.accessToken,
        tokenExpiresAt: this.tokenExpiresAt
      };
    } catch (err) {
      throw Object.assign(new Error(`AUTH_EXPIRED: Token refresh failed: ${err.message}`), { code: 'AUTH_EXPIRED' });
    }
  }

  async sendEmail({ to, subject, body }) {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: gmail'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }
    
    // Construct RFC 2822 email format and base64url encode it
    const emailContent = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedEmail },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      return {
        sent: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
        status: 'DELIVERED'
      };
    } catch (err) {
      if (err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: gmail'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Gmail send failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  async readMail() {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: gmail'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }
    try {
      const listResponse = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 15000
        }
      );
      
      const messages = listResponse.data.messages || [];
      const detailedMessages = [];

      for (const msg of messages) {
        const detailResponse = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
            timeout: 10000
          }
        );
        detailedMessages.push({
          id: detailResponse.data.id,
          snippet: detailResponse.data.snippet,
          internalDate: detailResponse.data.internalDate
        });
      }
      return { messages: detailedMessages };
    } catch (err) {
      if (err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: gmail'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Gmail read failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }
}

module.exports = GmailIntegration;
