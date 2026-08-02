const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markRead);
router.get('/achievements', notificationController.getAchievements);

module.exports = router;
