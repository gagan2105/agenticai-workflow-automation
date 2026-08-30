const integrationService = require('../services/integrationService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const {
  GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_SECRET,
  SLACK_CLIENT_ID, SLACK_CALLBACK_URL, SLACK_CLIENT_SECRET,
  DISCORD_CLIENT_ID, DISCORD_CALLBACK_URL, DISCORD_CLIENT_SECRET
} = require('../config/env');

const GmailIntegration = require('../integrations/gmailIntegration');
const SlackIntegration = require('../integrations/slackIntegration');
const DiscordIntegration = require('../integrations/discordIntegration');
const GoogleSheetsIntegration = require('../integrations/googleSheetsIntegration');

const getStatus = async (req, res, next) => {
  try {
    const list = await integrationService.getUserIntegrations(req.user.id);
    const statusMap = {};
    for (const item of list) {
      statusMap[item.provider] = item.status || 'disconnected';
    }
    res.json({ success: true, status: statusMap });
  } catch (err) { next(err); }
};

const oauthStart = async (req, res, next) => {
  try {
    const { provider } = req.params;
    
    // Sign the userId into the OAuth state parameter to prevent CSRF and identify the user on callback
    const state = jwt.sign({ userId: req.user.id }, JWT_SECRET, { expiresIn: '15m' });
    let authUrl = '';

    if (provider === 'gmail' && GOOGLE_CLIENT_ID) {
      authUrl = GmailIntegration.getAuthUrl(GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL) + `&state=${state}`;
    } else if (provider === 'google-sheets' && GOOGLE_CLIENT_ID) {
      authUrl = GoogleSheetsIntegration.getAuthUrl(GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL) + `&state=${state}`;
    } else if (provider === 'slack' && SLACK_CLIENT_ID) {
      authUrl = SlackIntegration.getAuthUrl(SLACK_CLIENT_ID, SLACK_CALLBACK_URL) + `&state=${state}`;
    } else if (provider === 'discord' && DISCORD_CLIENT_ID) {
      authUrl = DiscordIntegration.getAuthUrl(DISCORD_CLIENT_ID, DISCORD_CALLBACK_URL) + `&state=${state}`;
    } else {
      // Fallback redirect url for mock sandbox
      authUrl = `${req.protocol}://${req.get('host')}/api/integrations/oauth/${provider}/callback?code=mock_code&state=${state}`;
    }

    res.json({ success: true, authUrl });
  } catch (err) { next(err); }
};

const oauthCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code) {
      return res.redirect('/api/integrations/oauth/error');
    }

    // Decode state to verify and extract the userId
    let userId;
    try {
      const decoded = jwt.verify(state, JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.redirect('/api/integrations/oauth/error');
    }

    let tokens = {};
    if (code !== 'mock_code') {
      if ((provider === 'gmail' || provider === 'google-sheets') && GOOGLE_CLIENT_ID) {
        tokens = await GmailIntegration.exchangeCodeForTokens(code, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
      } else if (provider === 'slack' && SLACK_CLIENT_ID) {
        tokens = await SlackIntegration.exchangeCodeForTokens(code, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_CALLBACK_URL);
      } else if (provider === 'discord' && DISCORD_CLIENT_ID) {
        tokens = await DiscordIntegration.exchangeCodeForTokens(code, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_CALLBACK_URL);
      }
    } else {
      // Mock tokens for sandbox mode
      tokens = {
        accessToken: `mock_access_token_${provider}_${Date.now()}`,
        refreshToken: `mock_refresh_token_${provider}_${Date.now()}`,
        expiresIn: 3600
      };
    }

    await integrationService.upsertUserIntegration(userId, {
      provider,
      status: 'connected',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
      accountEmail: tokens.accountEmail || `${provider}_user@agentflow.ai`,
    });

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 3rem; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="color: #38bdf8;">Integration Connected!</h1>
        <p>Your ${provider} account has been successfully connected to Agentflow AI.</p>
        <button onclick="window.close()" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #38bdf8; border: none; color: #0f172a; font-weight: bold; border-radius: 8px; cursor: pointer;">Close Window</button>
      </div>
    `);
  } catch (err) {
    console.error('[OAuth Callback Error]:', err.message);
    res.redirect('/api/integrations/oauth/error');
  }
};

const oauthError = async (req, res, next) => {
  res.status(400).send(`
    <div style="font-family: sans-serif; text-align: center; padding: 3rem; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #ef4444;">Authorization Error</h1>
      <p>The OAuth handshake failed or was rejected. Please try again.</p>
      <button onclick="window.close()" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #ef4444; border: none; color: #ffffff; font-weight: bold; border-radius: 8px; cursor: pointer;">Close Window</button>
    </div>
  `);
};

const listIntegrations = async (req, res, next) => {
  try {
    const list = await integrationService.getUserIntegrations(req.user.id);
    res.json({ success: true, integrations: list });
  } catch (err) { next(err); }
};

const upsertIntegration = async (req, res, next) => {
  try {
    const integration = await integrationService.upsertUserIntegration(req.user.id, req.body);
    res.json({ success: true, integration });
  } catch (err) { next(err); }
};

module.exports = { getStatus, oauthStart, oauthCallback, oauthError, listIntegrations, upsertIntegration };

