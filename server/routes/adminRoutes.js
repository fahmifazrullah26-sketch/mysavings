const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.patch('/users/:id/activate', adminController.activateUser);
router.get('/stats', adminController.stats);

module.exports = router;
