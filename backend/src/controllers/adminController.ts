import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import { body, validationResult } from 'express-validator';

import Match from '../models/Match'; // Assuming you have a Match model
import Sport from '../models/Sport';
// Assuming you have a Message model

// Admin: Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password_hash', 'google_id', 'facebook_id', 'provider', 'provider_id'],
      },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Get user details by ID
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password_hash', 'google_id', 'facebook_id', 'provider', 'provider_id'],
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'User details retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Delete a user by ID
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent deleting the currently authenticated admin user
    // if (req.user.id === userId) {
    //   return res.status(400).json({ message: 'Cannot delete your own admin account.' });
    // }

    await user.destroy();

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Block a user by ID
// Assumes 'is_blocked_by_admin' field exists on the User model
export const adminBlockUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is already blocked
    if (user.is_blocked_by_admin) {
      return res.status(400).json({ message: `User ${userId} is already blocked.` });
    }

 await user.update({ is_blocked_by_admin: true });

    res.status(200).json({ message: `User ${userId} blocked by admin.` });
  } catch (error) {
    console.error('Error blocking user by admin:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Unblock a user by ID
// Assumes 'is_blocked_by_admin' field exists on the User model
export const adminUnblockUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is not blocked
    if (!user.is_blocked_by_admin) {
      return res.status(400).json({ message: `User ${userId} is not blocked.` });
    }

 await user.update({ is_blocked_by_admin: false });

    res.status(200).json({ message: `User ${userId} unblocked by admin.` });
  } catch (error) {
    console.error('Error unblocking user by admin:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Get all reports
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const {
      page = 1, limit = 10, status, reportedItemType, sortBy = 'created_at', sortOrder = 'DESC',
    } = req.query;
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const whereClause: any = {};
    if (status) whereClause.status = status as string;
    if (reportedItemType) whereClause.reported_item_type = reportedItemType as string;

    const validSortBy = ['created_at', 'status'];
    const validSortOrder = ['ASC', 'DESC'];
    const orderClause: any = [[validSortBy.includes(sortBy as string) ? sortBy : 'created_at', validSortOrder.includes(sortOrder as string) ? sortOrder : 'DESC']];


    const { count, rows: reports } = await Report.findAndCountAll({
      include: [
        {
          model: User,
          as: 'reporter', // Assuming you have this alias in associations
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      where: whereClause,
      order: orderClause,
      limit: parsedLimit,
      offset,
    });
    res.status(200).json({
      message: 'Reports retrieved successfully',
      data: { reports, count },
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Get report details by ID
export const getReportDetails = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'reporter', // Assuming you have this alias in associations
          attributes: ['id', 'first_name', 'last_name'],
        },
        // Add includes for reported items (match, user, message) if needed
      ],
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    let reportedItemDetails = null;

    // Fetch reported item details based on type
    switch (report.reported_item_type) {
      case 'match':
        reportedItemDetails = await Match.findByPk(report.reported_item_id);
        break;
      case 'user':
        reportedItemDetails = await User.findByPk(report.reported_item_id, {
          attributes: {
            exclude: ['password_hash', 'google_id', 'facebook_id', 'provider', 'provider_id'],
          },
        });
        break;
      case 'message':
        // Assuming you have a Message model and it's accessible
        // reportedItemDetails = await Message.findByPk(report.reported_item_id);
        // For now, if no Message model, just indicate it's a message
        reportedItemDetails = { messageId: report.reported_item_id, details: 'Message details not available via this endpoint' };
        break;
      default:
        // Handle other potential types or do nothing
        break;
    }

    res.status(200).json({
      message: 'Report details retrieved successfully',
      data: {
        report,
        reportedItemDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Update report status by ID
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body; // Assuming status is sent in the request body

    if (!status) {
      return res.status(400).json({ message: 'Report status is required.' });
    }

    // You might want to validate the status value against the allowed enum values
    // For example: if (!['pending', 'under_review', 'resolved'].includes(status)) { ... }

    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    await report.update({ status });

    res.status(200).json({ message: 'Report status updated successfully.', data: { report } });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Export controller functions

// Admin: Get all sports
export const getAllSports = async (req: Request, res: Response) => {
  try {
    const sports = await Sport.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      message: 'Sports retrieved successfully',
      data: {
        sports,
        count: sports.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all sports:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Create a new sport
export const createSport = [
  body('name')
    .exists().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name cannot be empty'),
  body('min_players')
    .exists().withMessage('min_players is required')
    .isInt({ gt: 0 }).withMessage('min_players must be an integer greater than 0'),
  body('max_players')
    .exists().withMessage('max_players is required')
    .isInt({ gt: 0 }).withMessage('max_players must be an integer greater than 0')
    .custom((value, { req }) => {
      if (value < req.body.min_players) {
        throw new Error('max_players must be greater than or equal to min_players');
      }
      return true;
    }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, min_players, max_players } = req.body;

    // Check if a sport with the same name already exists
    const existingSport = await Sport.findOne({ where: { name } });
    if (existingSport) {
      return res.status(409).json({ errors: [{ msg: 'Sport with this name already exists.', param: 'name' }] });
    }

    const newSport = await Sport.create({ name, min_players, max_players });

    res.status(201).json({ message: 'Sport created successfully', data: { sport: newSport } });
  } catch (error) {
    console.error('Error creating sport:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Update a sport by ID
export const updateSport = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name cannot be empty'),
  body('min_players')
    .optional()
    .isInt({ gt: 0 }).withMessage('min_players must be an integer greater than 0'),
  body('max_players')
    .optional()
    .isInt({ gt: 0 }).withMessage('max_players must be an integer greater than 0')
    .custom((value, { req }) => {
      const minPlayers = req.body.min_players !== undefined ? req.body.min_players : req.sport.min_players; // Use existing if not provided
      if (value < minPlayers) {
        throw new Error('max_players must be greater than or equal to min_players');
      }
      return true;
    }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sportId } = req.params;
    const { name, min_players, max_players } = req.body;

    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found.' });
    }

    // Attach sport to the request for custom validator
    (req as any).sport = sport;

    const updateData: any = { name, min_players, max_players };
    await sport.update(updateData);

    res.status(200).json({ message: 'Sport updated successfully', data: { sport } });
  } catch (error) {
    console.error('Error updating sport:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin: Delete a sport by ID
export const deleteSport = async (req: Request, res: Response) => {
  try {
    const { sportId } = req.params;

    const sport = await Sport.findByPk(sportId);

    if (!sport) {
      return res.status(404).json({ message: 'Sport not found.' });
    }

    // Before deleting a sport, consider how to handle existing matches or user preferences
    // associated with this sport. Options include:
    // 1. Disallowing deletion if associated records exist.
    // 2. Setting associated records' sport_id to null (if allowed by schema).
    // 3. Deleting associated records (use with caution).
    // For now, we'll just delete the sport.

    await sport.destroy();

    res.status(200).json({ message: 'Sport deleted successfully' });
  } catch (error) {
    console.error('Error deleting sport:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const adminController = {
  getAllUsers,
  getUserDetails,
  deleteUser,
  adminBlockUser,
  adminUnblockUser,
  getAllSports,
  createSport,
  updateSport,
  deleteSport,
  getAllReports,
  getReportDetails,
  updateReportStatus,
};

export default adminController;