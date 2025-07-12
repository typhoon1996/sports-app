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

// Protected routes (authentication required)

// Match Management
router.post('/', authenticateToken, createMatch); // Create a new match
router.put('/:id', authenticateToken, updateMatch); // Update a match by ID
router.delete('/:id', authenticateToken, deleteMatch); // Delete a match by ID

// User-Specific Matches
router.get('/user/organized', authenticateToken, getUserMatches); // Get matches organized by the authenticated user
router.get('/user/participating', authenticateToken, getUserParticipatingMatches); // Get matches the authenticated user is participating in

// Participation
router.post('/:matchId/join', authenticateToken, joinMatch); // Join a match
router.delete('/:matchId/leave', authenticateToken, leaveMatch); // Leave a match

// Note: getMatchParticipants is intentionally public as it allows anyone to view participants.
// If participant viewing should be restricted, move this route to the protected section.
router.get('/:matchId/participants', getMatchParticipants); // Get participants of a match


export default router;
