const integrationService = require('../services/integrationService');

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
    res.json({ success: true, authUrl: `http://localhost:5000/api/integrations/oauth/${provider}/callback` });
  } catch (err) { next(err); }
};

const oauthCallback = async (req, res, next) => {
  res.send('OAuth flow completed successfully. You can close this window.');
};

const oauthError = async (req, res, next) => {
  res.status(400).send('OAuth authorization error.');
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
