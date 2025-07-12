import express from 'express';
import { authenticateToken } from '../middleware/performance';
import friendshipsController from '../controllers/friendshipsController';

const router = express.Router(); // Changed to router variable

// Friend Requests
router.post(
  '/requests/:receiverId', // Renamed to plural 'requests'
  authenticateToken,
  friendshipsController.sendFriendRequest
);
router.put(
  '/requests/:requestId/accept', // Renamed for clarity on action
  authenticateToken,
  friendshipsController.acceptFriendRequest
);
router.put(
  '/requests/:requestId/reject', // Renamed for clarity on action
  authenticateToken,
  friendshipsController.rejectFriendRequest
);
router.get(
  '/pending', // Keep '/pending' for fetching pending requests
  authenticateToken,
  friendshipsController.getUserPendingRequests
);

// Friendships
router.get(
  '/friendships',
  authenticateToken,
  friendshipsController.getUserFriendships
);
router.delete(
  '/friendships/:friendshipId', // Renamed to include '/friendships'
  authenticateToken,
  friendshipsController.removeFriendship
);

// Blocking
router.put( // Changed to put for block user
  '/blocking/:userId', // Renamed to plural 'blocking'
  authenticateToken,
  friendshipsController.blockUser // Add blockUser controller
);
router.put(
  '/blocking/:userId/unblock', // Renamed for clarity on action
  authenticateToken,
  friendshipsController.unblockUser
);

export default router;