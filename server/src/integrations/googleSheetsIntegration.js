const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tokenExpiresAt = config.tokenExpiresAt;
  }

  static getAuthUrl(clientId, redirectUri) {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
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

  async appendRow({ spreadsheetId, range, values }) {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: google-sheets'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    const cleanRange = range || 'Sheet1!A1';
    // Format values to ensure it is a 2D array: [[val1, val2, ...]]
    const rowValues = Array.isArray(values) ? (Array.isArray(values[0]) ? values : [values]) : [[values]];

    try {
      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cleanRange)}:append?valueInputOption=RAW`,
        { values: rowValues },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      return {
        appended: true,
        spreadsheetId,
        updatedRange: response.data.updates?.updatedRange,
        updatedRows: response.data.updates?.updatedRows || 0
      };
    } catch (err) {
      if (err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: google-sheets'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Google Sheets append failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  async readRange({ spreadsheetId, range }) {
    if (!this.accessToken) {
      throw Object.assign(new Error('INTEGRATION_NOT_CONNECTED: google-sheets'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    const cleanRange = range || 'Sheet1!A:Z';

    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cleanRange)}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 15000
        }
      );
      return {
        spreadsheetId,
        range: response.data.range,
        values: response.data.values || []
      };
    } catch (err) {
      if (err.response?.status === 401) {
        throw Object.assign(new Error('AUTH_EXPIRED: google-sheets'), { code: 'AUTH_EXPIRED' });
      }
      throw new Error(`Google Sheets read failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }
}

module.exports = GoogleSheetsIntegration;
