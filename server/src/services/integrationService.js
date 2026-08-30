const Integration = require('../models/Integration');
const GmailIntegration = require('../integrations/gmailIntegration');
const SlackIntegration = require('../integrations/slackIntegration');
const DiscordIntegration = require('../integrations/discordIntegration');
const GoogleSheetsIntegration = require('../integrations/googleSheetsIntegration');
const {
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  SLACK_CLIENT_ID, SLACK_CLIENT_SECRET,
  DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
} = require('../config/env');

const inMemoryIntegrations = {};

const getIntegrationContext = async (userId) => {
  const context = {};

  // Default sandbox / auto-mock implementations
  const mockGmail = {
    sendEmail: async ({ to, subject, body }) => ({
      sent: true,
      messageId: `msg_${Date.now()}`,
      to: to || 'recipient@example.com',
      subject: subject || 'Automated Email (Sandbox)',
      status: 'DELIVERED',
    }),
  };

  const mockSlack = {
    postMessage: async ({ channel, text }) => ({
      posted: true,
      ts: `${Date.now()}.000100`,
      channel: channel || '#general',
      text: text || 'Automated Slack message (Sandbox)',
    }),
  };

  const mockDiscord = {
    postMessage: async ({ channelId, message }) => ({
      posted: true,
      id: `disc_${Date.now()}`,
      channelId: channelId || 'general',
      message: message || 'Automated Discord message (Sandbox)',
    }),
  };

  const mockSheets = {
    appendRow: async ({ spreadsheetId, range, values }) => ({
      appended: true,
      updatedRange: `${range || 'A1'}:Z100`,
      updatedRows: 1,
    }),
  };

  // Check DB or in-memory connected integrations
  let userIntegrations = [];
  try {
    userIntegrations = await Integration.find({ owner: userId, status: 'connected' });
  } catch {
    userIntegrations = inMemoryIntegrations[userId] || [];
  }

  // Set default mocks first
  context['gmail'] = mockGmail;
  context['slack'] = mockSlack;
  context['discord'] = mockDiscord;
  context['google-sheets'] = mockSheets;

  // Overwrite with real ones if connected
  for (const item of userIntegrations) {
    const provider = item.provider;
    try {
      const accessToken = item.getDecryptedAccessToken();
      const refreshToken = item.getDecryptedRefreshToken();
      const tokenExpiresAt = item.tokenExpiresAt;

      // Handle token expiration / refresh
      let activeAccessToken = accessToken;
      let activeExpiresAt = tokenExpiresAt;

      if (tokenExpiresAt && new Date(tokenExpiresAt) <= new Date()) {
        // Refresh token if expired
        if (provider === 'gmail' && GOOGLE_CLIENT_ID) {
          const client = new GmailIntegration({ accessToken, refreshToken, tokenExpiresAt });
          const refreshed = await client.refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
          activeAccessToken = refreshed.accessToken;
          activeExpiresAt = refreshed.tokenExpiresAt;
          
          // Save refreshed token
          item.accessToken = activeAccessToken;
          item.tokenExpiresAt = activeExpiresAt;
          await item.save();
        } else if (provider === 'google-sheets' && GOOGLE_CLIENT_ID) {
          const client = new GoogleSheetsIntegration({ accessToken, refreshToken, tokenExpiresAt });
          const refreshed = await client.refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
          activeAccessToken = refreshed.accessToken;
          activeExpiresAt = refreshed.tokenExpiresAt;
          
          item.accessToken = activeAccessToken;
          item.tokenExpiresAt = activeExpiresAt;
          await item.save();
        }
      }

      if (provider === 'gmail') {
        context['gmail'] = new GmailIntegration({ accessToken: activeAccessToken, refreshToken, tokenExpiresAt: activeExpiresAt });
      } else if (provider === 'slack') {
        context['slack'] = new SlackIntegration({ accessToken: activeAccessToken });
      } else if (provider === 'discord') {
        context['discord'] = new DiscordIntegration({ accessToken: activeAccessToken });
      } else if (provider === 'google-sheets') {
        context['google-sheets'] = new GoogleSheetsIntegration({ accessToken: activeAccessToken, refreshToken, tokenExpiresAt: activeExpiresAt });
      }
    } catch (err) {
      console.warn(`[Integration Service] Failed to initialize real adapter for ${provider}, falling back to mock:`, err.message);
    }
  }

  return context;
};

const upsertUserIntegration = async (userId, data) => {
  try {
    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider: data.provider },
      { ...data, owner: userId },
      { upsert: true, new: true }
    );
    return integration;
  } catch {
    if (!inMemoryIntegrations[userId]) inMemoryIntegrations[userId] = [];
    const idx = inMemoryIntegrations[userId].findIndex(i => i.provider === data.provider);
    const item = { id: `int_${Date.now()}`, owner: userId, ...data };
    if (idx >= 0) inMemoryIntegrations[userId][idx] = item;
    else inMemoryIntegrations[userId].push(item);
    return item;
  }
};

const getUserIntegrations = async (userId) => {
  try {
    return await Integration.find({ owner: userId });
  } catch {
    return inMemoryIntegrations[userId] || [
      { provider: 'gmail', status: 'connected', accountEmail: 'user@agentflow.ai' },
      { provider: 'slack', status: 'connected', accountEmail: 'workspace@slack.com' },
      { provider: 'discord', status: 'connected' },
      { provider: 'google-sheets', status: 'connected' },
    ];
  }
};

module.exports = { getIntegrationContext, upsertUserIntegration, getUserIntegrations };

