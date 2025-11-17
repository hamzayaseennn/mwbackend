const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationStats,
  getServiceReminders,
  sendEmailNotification,
  sendWhatsAppNotification,
  sendBulkNotifications,
  getNotificationHistory,
  createCustomNotification
} = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.get('/service-reminders', getServiceReminders);
router.get('/history', getNotificationHistory);
router.post('/send-email', sendEmailNotification);
router.post('/send-whatsapp', sendWhatsAppNotification);
router.post('/send-bulk', sendBulkNotifications);
router.post('/custom', createCustomNotification);

module.exports = router;

