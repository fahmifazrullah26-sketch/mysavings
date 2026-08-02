const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middleware/auth');
const { validate, incomeExpenseRules } = require('../middleware/validators');

router.use(verifyToken); // semua route expense wajib login

router.get('/', expenseController.getAll);
router.get('/:id', expenseController.getOne);
router.post('/', incomeExpenseRules, validate, expenseController.create);
router.put('/:id', incomeExpenseRules, validate, expenseController.update);
router.delete('/:id', expenseController.remove);

module.exports = router;
