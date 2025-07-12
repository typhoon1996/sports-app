import express from 'express';
import { signup, login, getProfile, updateUserProfile, changePassword, getUserProfile, getUserNotificationPreferences, updateUserNotificationPreferences } from '../controllers/authController';
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
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// --- Authentication Routes (Public) ---
router.post('/signup', signup);
router.post('/login', login);

// --- User Profile Routes (Protected) ---
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, upload.single('profile_picture'), updateUserProfile);

// --- Password Management Routes (Protected) ---
router.put('/change-password', authenticateToken, changePassword);

// --- Notification Preferences Routes (Protected) ---
router.get('/preferences/notifications', authenticateToken, getUserNotificationPreferences);
router.put('/preferences/notifications', authenticateToken, updateUserNotificationPreferences);


export default router;

