import { Request, Response } from 'express';
import Notification from '../models/Notification';

// Controller to fetch user's notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const { page = 1, limit = 10, is_read, include_dismissed, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {
      user_id: userId,
    };

    if (is_read !== undefined) {
      whereClause.is_read = (is_read as string).toLowerCase() === 'true';
    }

    // Exclude dismissed notifications by default
    if (include_dismissed === undefined || (include_dismissed as string).toLowerCase() !== 'true') {
      whereClause.is_dismissed = false;
    }

    const orderClause: any = [];
    const allowedSortFields = ['created_at', 'is_read'];

    if (allowedSortFields.includes(sortBy as string)) {
      orderClause.push([sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
    } else {
      // Default sort order if sortBy is invalid
      orderClause.push(['created_at', 'DESC']);
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: orderClause,
      limit: limitNum,
      offset: offset,
    });

    res.status(200).json({ message: 'Notifications retrieved successfully', data: { notifications } });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
// Controller to mark a notification as read
export const markNotificationAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId, // Ensure the notification belongs to the user
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or does not belong to user.' });
    }

 if (!notification.is_read) {
      notification.is_read = true;
 await notification.save();
    }

    res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error while marking notification as read.' });
  }
};

// Controller to dismiss a notification
export const dismissNotification = async (req: any, res: Response) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId, // Ensure the notification belongs to the user
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or does not belong to user.' });
    }

    // Assuming you add an 'is_dismissed' boolean field to the Notification model
 if (!notification.is_dismissed) {
 notification.is_dismissed = true;
 await notification.save();
    }

    res.status(200).json({ message: 'Notification dismissed successfully.', notification });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ message: 'Internal server error while dismissing notification.' });
  }
};

// Controller to delete a notification
export const deleteNotification = async (req: any, res: Response) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const notificationId = req.params.id;

    const deletedCount = await Notification.destroy({
      where: {
        id: notificationId,
        user_id: userId, // Ensure the notification belongs to the user
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Notification not found or does not belong to user.' });
    }

    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Internal server error while deleting notification.' });
  }
};