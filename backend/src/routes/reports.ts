import express from 'express';
import { authenticateToken } from '../middleware/performance';
import reportsController from '../controllers/reportsController';

const router = express.Router();

// Protected routes (User Reporting)
router.post('/match/:matchId', authenticateToken, reportsController.reportMatch);
router.post('/user/:userId', authenticateToken, reportsController.reportUser);
// Assuming message IDs are available and can be sent in the request body or parameters
router.post('/message/:messageId', authenticateToken, reportsController.reportMessage);


export default router;