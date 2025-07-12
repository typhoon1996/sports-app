import Notification from '../models/Notification';
import { sendNotificationToUser } from '../socket/index';
import User from '../models/User';

export const createNotification = async (
  userId: string,
  type: string,
  message: string,
): Promise<void> => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'notification_preferences'],
    });

    if (!user) {
      console.error(`User with ID ${userId} not found.`);
      return;
    }

    const preferences = user.notification_preferences || {};
    const isNotificationEnabled = preferences[type] !== false; // Default to enabled if preference is not explicitly false

    if (!isNotificationEnabled) {
      console.log(`Notification type ${type} is disabled for user ${userId}.`);
      return;
    }
    // Create the notification in the database
    const newNotification = await Notification.create({
      user_id: userId,
      type: type,
      message: message,
 is_read: false, // New notifications are unread by default
    });

    // Emit real-time notification via Socket.io
    sendNotificationToUser(userId, newNotification);
    console.log(`🔔 Notification created and emitted for user ${userId}: ${message}`);

  } catch (error) {
    console.error('Error creating notification:', error);
    // Depending on your error handling strategy, you might want to rethrow or handle this differently
  }
};
