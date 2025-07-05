import express from 'express';
import { 
  createRating,
  getUserRatings,
  getMatchRatings,
  updateRating,
  deleteRating,
  getPendingRatings
} from '../controllers/ratingsController';
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// Public routes
router.get('/users/:userId', getUserRatings); // Get ratings for a specific user
router.get('/matches/:matchId', getMatchRatings); // Get ratings for a specific match

// Protected routes (authentication required)
router.post('/', authenticateToken, createRating); // Create a new rating
router.put('/:ratingId', authenticateToken, updateRating); // Update a rating
router.delete('/:ratingId', authenticateToken, deleteRating); // Delete a rating
router.get('/pending/me', authenticateToken, getPendingRatings); // Get pending ratings for current user

export default router;
