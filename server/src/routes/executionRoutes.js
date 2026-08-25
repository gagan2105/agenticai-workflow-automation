const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/executionController');

const router = express.Router();

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/timeline', ctrl.getTimeline);
router.post('/:id/pause', ctrl.pause);
router.post('/:id/resume', ctrl.resume);
router.post('/:id/cancel', ctrl.cancel);

module.exports = router;
