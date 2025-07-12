import express from 'express';
import { adminAuth } from '../middleware/performance';
import { authenticateToken } from '../utils/jwt'; // Corrected import path
import adminController, { deleteMessage, disableUser } from '../controllers/adminController'; // Assuming deleteMessage and disableUser are still needed here or moved to controllers if not admin specific
import adminController from '../controllers/adminController'; // Import the controller object
const router = express.Router(); 

// Apply authentication and admin authorization middleware to all admin routes
router.use(authenticateToken, adminAuth);

// User Management Routes
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUser);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/block', adminController.blockUser);
router.put('/users/:userId/unblock', adminController.unblockUser);

// Reported Content Management Routes
router.get('/reports', adminController.getAllReports);
router.get('/reports/:reportId', adminController.getReportDetails);
router.put('/reports/:reportId/status', adminController.updateReportStatus);
router.delete('/messages/:messageId', deleteMessage);
router.put('/users/:userId/disable', disableUser);
router.delete('/matches/:matchId', adminController.deleteMatch);

// Sports Management Routes
router.get('/sports', adminController.getAllSports);
router.post('/sports', adminController.createSport);
router.put('/sports/:sportId', adminController.updateSport);
router.delete('/sports/:sportId', adminController.deleteSport);


export default router;