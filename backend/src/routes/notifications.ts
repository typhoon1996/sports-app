import express from 'express';
import { authenticateToken } from '../middleware/auth'; // Assuming the path to your auth middleware
import notificationController from '../controllers/notificationsController';

const router = express.Router();

// GET /api/notifications - Fetch current user's notifications
router.get('/', authenticateToken, notificationController.getUserNotifications);

// PUT /api/notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', authenticateToken, notificationController.markNotificationAsRead);

// PUT /api/notifications/:id/dismiss - Mark a specific notification as dismissed
router.put('/:id/dismiss', authenticateToken, notificationController.dismissNotification);

// DELETE /api/notifications/:id - Permanently delete a specific notification
router.delete('/:id', authenticateToken, notificationController.deleteNotification);
export default router;