import express from 'express';
import { 
  getMatches, 
  getMatchById,
  getMatchDetails, 
  createMatch, 
  updateMatch, 
  deleteMatch,
  getUserMatches,
  joinMatch,
  leaveMatch,
  getUserParticipatingMatches,
  getMatchParticipants
} from '../controllers/matchesController';
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// Public routes
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/details', getMatchDetails);

// Protected routes
router.post('/', authenticateToken, createMatch);
router.put('/:id', authenticateToken, updateMatch);
router.delete('/:id', authenticateToken, deleteMatch);

// User-specific routes
router.get('/user/organized', authenticateToken, getUserMatches);
router.get('/user/participating', authenticateToken, getUserParticipatingMatches);

// Participation routes
router.post('/:matchId/join', authenticateToken, joinMatch);
router.delete('/:matchId/leave', authenticateToken, leaveMatch);
router.get('/:matchId/participants', getMatchParticipants);

export default router;
