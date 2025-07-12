import express from 'express';
import { authenticateToken } from '../middleware/performance';
import friendshipsController from '../controllers/friendshipsController';

const router = express.Router(); // Changed to router variable

router.post(
  '/request/:receiverId',
  authenticateToken,
  friendshipsController.sendFriendRequest
);
router.put(
  '/accept/:requestId',
  authenticateToken,
  friendshipsController.acceptFriendRequest
);
router.put(
  '/reject/:requestId',
  authenticateToken,
  friendshipsController.rejectFriendRequest
);
router.get(
  '/friendships',
  authenticateToken,
  friendshipsController.getUserFriendships
);
router.get(
  '/pending',
  authenticateToken,
  friendshipsController.getUserPendingRequests
);
router.delete(
  '/:friendshipId',
  authenticateToken,
  friendshipsController.removeFriendship
);
router.put( // Changed to put for block user
  '/block/:userId',
  authenticateToken,
  friendshipsController.blockUser // Add blockUser controller
);
router.put(
  '/unblock/:userId',
  authenticateToken,
  friendshipsController.unblockUser
);

export default router;