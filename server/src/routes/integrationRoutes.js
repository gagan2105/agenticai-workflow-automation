const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/integrationController');

const router = express.Router();

router.get('/status', auth, ctrl.getStatus);
router.get('/oauth/:provider/start', auth, ctrl.oauthStart);
router.get('/oauth/:provider/callback', ctrl.oauthCallback);
router.get('/oauth/error', ctrl.oauthError);
router.get('/', auth, ctrl.listIntegrations);
router.post('/', auth, ctrl.upsertIntegration);

module.exports = router;
