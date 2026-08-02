const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { verifyToken } = require('../middleware/auth');
const { validate, incomeExpenseRules } = require('../middleware/validators');

router.use(verifyToken); // semua route income wajib login

router.get('/', incomeController.getAll);
router.get('/:id', incomeController.getOne);
router.post('/', incomeExpenseRules, validate, incomeController.create);
router.put('/:id', incomeExpenseRules, validate, incomeController.update);
router.delete('/:id', incomeController.remove);

module.exports = router;
