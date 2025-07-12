import Friendship from '../models/Friendship';
import { Op } from 'sequelize';

export const isBlocked = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const blockedRelationship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: userId1, receiver_id: userId2, status: 'blocked' },
          { sender_id: userId2, receiver_id: userId1, status: 'blocked' },
        ],
      },
    });

    return !!blockedRelationship;
  } catch (error) {
    console.error('Error checking blocked status:', error);
    // Depending on your error handling strategy, you might re-throw
    // the error or return false to indicate an unknown status
    throw error; 
  }
};