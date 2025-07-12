import { Request, Response } from 'express';
import Report from '../models/Report';
import Match from '../models/Match';
import User from '../models/User';
import { AuthenticatedRequest } from '../utils/jwt';

export const reportMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason for reporting is required.' });
    }

    const match = await Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    const report = await Report.create({
      reporter_id: userId,
      reported_item_type: 'match',
      reported_item_id: matchId,
      reason,
    });

    res.status(201).json({
      message: 'Match reported successfully.',
      data: { report }
    });
  } catch (error) {
    console.error('Error reporting match:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const reportUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { userId: reportedUserId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason for reporting is required.' });
    }

    if (userId === reportedUserId) {
      return res.status(400).json({ message: 'You cannot report yourself.' });
    }

    const reportedUser = await User.findByPk(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'User to report not found.' });
    }

    const report = await Report.create({
      reporter_id: userId,
      reported_item_type: 'user',
      reported_item_id: reportedUserId,
      reason,
    });

    res.status(201).json({
      message: 'User reported successfully.',
      data: { report }
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const reportMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason for reporting is required.' });
    }

    // TODO: Implement logic to find the message by ID.
    // This requires having a message model and logic to store messages with IDs.
    // For now, we'll assume the messageId is valid and just create the report.
    console.warn(`Reporting message with ID ${messageId}. Message validation not implemented yet.`);


    const report = await Report.create({
      reporter_id: userId,
      reported_item_type: 'message',
      reported_item_id: messageId, // Assuming messageId is the ID of the message
      reason,
    });

    res.status(201).json({
      message: 'Message reported successfully.',
      data: { report }
    });
  } catch (error) {
    console.error('Error reporting message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const reportsController = {
  reportMatch,
  reportUser,
  reportMessage,
};

export default reportsController;