const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/workflowController');

const router = express.Router();

router.use(auth);

router.get('/dashboard', ctrl.getDashboard);
router.get('/', ctrl.list);
router.post('/', [body('name').trim().notEmpty().withMessage('Workflow name required')], validate, ctrl.create);
router.post('/generate', [body('prompt').trim().notEmpty().withMessage('Prompt required')], validate, ctrl.generate);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.post('/:id/duplicate', ctrl.duplicate);
router.post('/:id/execute', ctrl.execute);
router.delete('/:id', ctrl.remove);

module.exports = router;
