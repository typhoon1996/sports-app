import express from 'express';
import { 
  getAllSports, 
  getSportById, 
  createSport, 
  updateSport, 
  deleteSport 
} from '../controllers/sportsController';
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// --- Public routes ---
router.get('/', getAllSports);
router.get('/:id', getSportById);

// --- Protected routes (Admin) ---
router.post('/', authenticateToken, createSport);
router.put('/:id', authenticateToken, updateSport);
router.delete('/:id', authenticateToken, deleteSport);

export default router;
