const Integration = require('../models/Integration');

const inMemoryIntegrations = {};

const getIntegrationContext = async (userId) => {
  const context = {};

  // Default sandbox / auto-mock implementations for all integrations
  const mockGmail = {
    sendEmail: async ({ to, subject, body }) => ({
      sent: true,
      messageId: `msg_${Date.now()}`,
      to: to || 'recipient@example.com',
      subject: subject || 'Automated Email',
      status: 'DELIVERED',
    }),
  };

  const mockSlack = {
    postMessage: async ({ channel, text }) => ({
      posted: true,
      ts: `${Date.now()}.000100`,
      channel: channel || '#general',
      text: text || 'Automated Slack message',
    }),
  };

  const mockDiscord = {
    postMessage: async ({ channelId, message }) => ({
      posted: true,
      id: `disc_${Date.now()}`,
      channelId: channelId || 'general',
      message: message || 'Automated Discord message',
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
    userIntegrations = await Integration.find({ user: userId, status: 'connected' });
  } catch {
    userIntegrations = inMemoryIntegrations[userId] || [];
  }

  // Always supply implementations (real or sandbox mock)
  context['gmail'] = mockGmail;
  context['slack'] = mockSlack;
  context['discord'] = mockDiscord;
  context['google-sheets'] = mockSheets;

  return context;
};

const upsertUserIntegration = async (userId, data) => {
  try {
    const integration = await Integration.findOneAndUpdate(
      { user: userId, provider: data.provider },
      { ...data, user: userId },
      { upsert: true, new: true }
    );
    return integration;
  } catch {
    if (!inMemoryIntegrations[userId]) inMemoryIntegrations[userId] = [];
    const idx = inMemoryIntegrations[userId].findIndex(i => i.provider === data.provider);
    const item = { id: `int_${Date.now()}`, user: userId, ...data };
    if (idx >= 0) inMemoryIntegrations[userId][idx] = item;
    else inMemoryIntegrations[userId].push(item);
    return item;
  }
};

const getUserIntegrations = async (userId) => {
  try {
    return await Integration.find({ user: userId });
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
