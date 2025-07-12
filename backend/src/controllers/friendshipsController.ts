import { Request, Response } from 'express';
import Friendship from '../models/Friendship';
import User from '../models/User';
import { AuthenticatedRequest } from '../utils/jwt';
import { Op } from 'sequelize';
import { createNotification } from '../utils/notificationUtils';

export const sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    if (senderId === receiverId) {
      res.status(400).json({
        error: 'You cannot send a friend request to yourself',
        code: 'SELF_REQUEST_NOT_ALLOWED'
      });
      return;
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      res.status(404).json({
        error: 'Receiver user not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Check if a friendship already exists (pending, accepted, rejected, or blocked)
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId }
        ],
        // Check for existing friendship with any status, including blocked
      }
    });

    // Check if either user has blocked the other
    const blockedRelationship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId, status: 'blocked' },
          { sender_id: receiverId, receiver_id: senderId, status: 'blocked' },
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'pending') {
        res.status(409).json({
          error: 'A pending friend request already exists',
          code: 'PENDING_REQUEST_EXISTS'
        });
      } else if (existingFriendship.status === 'accepted') {
        res.status(409).json({
          error: 'You are already friends with this user',
          code: 'ALREADY_FRIENDS'
        });
      } else if (existingFriendship.status === 'blocked') {
        res.status(409).json({
          error: 'Friendship is blocked',
          code: 'FRIENDSHIP_BLOCKED'
        });
      }
    } else if (blockedRelationship) {
       res.status(409).json({
          error: 'Friendship is blocked',
          code: 'FRIENDSHIP_BLOCKED'
        });
      } else {
        res.status(409).json({
          error: 'A friendship relationship already exists',
          code: 'FRIENDSHIP_EXISTS'
        });
      }
      return;
    }

    const friendship = await Friendship.create({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });

    // Fetch sender details for notification message
    const sender = req.user;

    // Create notification for the receiver about the new friend request
    await createNotification(receiverId, 'friend_request_received', 
      `${sender.first_name} ${sender.last_name} sent you a friend request.`
    );

    res.status(201).json({
      message: 'Friend request sent successfully',
      data: { friendship }
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      error: 'Internal server error while sending friend request',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;

    const friendship = await Friendship.findOne({
      where: {
        id: requestId,
        receiver_id: receiverId,
        status: 'pending'
      }
    });

    if (!friendship) {
      res.status(404).json({
        error: 'Pending friend request not found',
        code: 'REQUEST_NOT_FOUND'
      });
      return;
    }

    await friendship.update({ status: 'accepted' });

    // Fetch receiver details for notification message
    const receiver = req.user;

    // Create notification for the sender that the request was accepted
    await createNotification(friendship.sender_id, 'friend_request_accepted',
      `${receiver.first_name} ${receiver.last_name} accepted your friend request.`
    );

    
    res.status(200).json({
      message: 'Friend request accepted successfully',
      data: { friendship }
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      error: 'Internal server error while accepting friend request',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const rejectFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;

    const friendship = await Friendship.findOne({
      where: {
        id: requestId,
        receiver_id: receiverId,
        status: 'pending'
      }
    });

    if (!friendship) {
      res.status(404).json({
        error: 'Pending friend request not found',
        code: 'REQUEST_NOT_FOUND'
      });
      return;
    }

    // We can either update status to 'rejected' or delete the record
    await friendship.destroy(); // Or await friendship.update({ status: 'rejected' });

    // Fetch receiver details for notification message
    const receiver = req.user;

    // Create notification for the sender that the request was rejected
    await createNotification(friendship.sender_id, 'friend_request_rejected',
      `${receiver.first_name} ${receiver.last_name} rejected your friend request.`
    );


    res.status(200).json({
      message: 'Friend request rejected successfully',
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      error: 'Internal server error while rejecting friend request',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getUserFriendships = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await Friendship.findAndCountAll({
      where: {
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId }
 ] ,        status: 'accepted', [Op.or]: [ // Ensure neither party has blocked the other
          { sender_id: { [Op.not]: userId }, receiver_id: { [Op.not]: userId }, status: { [Op.not]: 'blocked' } },
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'avg_rating']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'avg_rating']
        }]
      limit: parseInt(limit as string),
      offset,
      order: [['created_at', 'DESC']],
    });

    const friendships = result.rows;
    const friends = friendships.map(friendship => {
      if (friendship.sender_id === userId) {
        return friendship.receiver;
      } else {
        return friendship.sender;
      }
    });


    res.status(200).json({
      message: 'User friendships retrieved successfully',
      data: { friends,
        pagination: {
          total: result.count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.count / parseInt(limit as string)), }, }
    });
  } catch (error) {
    console.error('Get user friendships error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching friendships',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getUserPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await Friendship.findAndCountAll({
      where: {
        receiver_id: userId,
 status: 'pending',
 status: { [Op.not]: 'blocked' } // Exclude blocked requests
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'avg_rating']
        }
      ],
      limit: parseInt(limit as string),
      offset,
      order: [['created_at', 'DESC']],
    });

    const pendingRequests = result.rows;
    res.status(200).json({
      message: 'User pending friend requests retrieved successfully',
      data: { pendingRequests,
        pagination: {
          total: result.count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.count / parseInt(limit as string)), }, }
    });
  } catch (error) {
    console.error('Get user pending requests error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching pending requests',
      code: 'INTERNAL_ERROR'
    });
  }
};


export const blockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user.id;
    const { userId: userToBlockId } = req.params;

    if (blockerId === userToBlockId) {
      res.status(400).json({
        error: 'You cannot block yourself',
        code: 'SELF_BLOCK_NOT_ALLOWED'
      });
      return;
    }

    const userToBlock = await User.findByPk(userToBlockId);
    if (!userToBlock) {
      res.status(404).json({
        error: 'User to block not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Find or create a friendship where the blocker is the sender
    const [friendship, created] = await Friendship.findOrCreate({
      where: {
        sender_id: blockerId,
        receiver_id: userToBlockId,
      },
      defaults: { status: 'blocked' },
    });

    // If friendship already exists, update its status to blocked
    if (!created && friendship.status !== 'blocked') {
        await friendship.update({ status: 'blocked' });
    }

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      error: 'Internal server error while blocking user',
      code: 'INTERNAL_ERROR'
    });
  }
};


export const unblockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const unblockerId = req.user.id;
    const { userId: userToUnblockId } = req.params;

    const friendship = await Friendship.findOne({
      where: {
        sender_id: unblockerId,
        receiver_id: userToUnblockId,
        status: 'blocked',
      },
    });

    if (!friendship) {
      res.status(404).json({ error: 'Blocked relationship not found' });
      return;
    }

    await friendship.destroy(); // Or update status to 'rejected' or 'none' if applicable

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Internal server error while unblocking user' });
  }
};


const friendshipsController = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getUserFriendships,
  getUserPendingRequests,
};

export default friendshipsController;