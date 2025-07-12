import express from 'express';
import { signup, login, getProfile, updateUserProfile, changePassword, getUserProfile, getUserNotificationPreferences, updateUserNotificationPreferences } from '../controllers/authController';
import { authenticateToken } from '../utils/jwt';
import multer from 'multer';
import path from 'path';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/profile_pictures'); // Store in ./uploads/profile_pictures
    },
    filename: (req: any, file, cb) => {
      cb(null, `${req.user.id}${path.extname(file.originalname)}`); // Use user ID as filename
    },
  }),
});

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, upload.single('profile_picture'), updateUserProfile);
router.put('/change-password', authenticateToken, changePassword);
router.get('/preferences/notifications', authenticateToken, getUserNotificationPreferences);
router.put('/preferences/notifications', authenticateToken, updateUserNotificationPreferences);


export default router;
