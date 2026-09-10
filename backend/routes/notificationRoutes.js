const express = require('express');
const { listNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, listNotifications);
router.patch('/read-all', verifyToken, markAllNotificationsRead);
router.patch('/:id/read', verifyToken, markNotificationRead);

module.exports = router;
