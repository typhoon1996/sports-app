import express from 'express';
import { signup, login, getProfile, updateUserProfile, changePassword } from '../controllers/authController';
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
