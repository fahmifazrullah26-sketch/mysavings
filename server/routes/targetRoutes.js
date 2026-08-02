const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { verifyToken } = require('../middleware/auth');
const { validate, targetRules } = require('../middleware/validators');

router.use(verifyToken);

router.get('/', targetController.getAll);
router.get('/calendar', targetController.calendar);
router.get('/:id', targetController.getOne);
router.post('/', targetRules, validate, targetController.create);
router.put('/:id', targetRules, validate, targetController.update);
router.delete('/:id', targetController.remove);
router.post('/:id/contribute', targetController.contribute);

module.exports = router;
