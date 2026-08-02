const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', transactionController.getAll);
router.get('/export', transactionController.exportData);

module.exports = router;
