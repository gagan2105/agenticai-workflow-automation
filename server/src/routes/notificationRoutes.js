const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const router = express.Router();

router.use(auth);

router.get('/', ctrl.list);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
