import { Request, Response } from 'express';
import { ValidationError, ValidationErrorItem } from 'sequelize';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { Op } from 'sequelize';
import * as Sentry from '@sentry/node';
import Match from '../models/Match';
import { Server } from 'socket.io';
import UserMatch from '../models/UserMatch';
import Rating from '../models/Rating';
import { AuthenticatedRequest } from '../utils/jwt';
import { createNotification } from '../utils/notificationUtils';

// Create a rating
export const createRating = [
  body('comment').optional().isString().isLength({ max: 500 }),
],
export const createRating = async (req: AuthenticatedRequest, res: Response, io: Server): Promise<void> => {
    const user = req.user;

  body('comment').optional().isString().isLength({ max: 500 }),
],
export const createRating = async (req: AuthenticatedRequest, res: Response, io: Server): Promise<void> => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      rated_user_id,
      match_id,
      rating,
      comment,
      rating_type = 'participant',
      is_anonymous = false
    } = req.body;

    // Validate required fields
    if (!rated_user_id || !match_id || !rating) {
      res.status(400).json({
        error: 'rated_user_id, match_id, and rating are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING'
      });
      return;
    }

    // Check if match exists
    const match = await Match.findByPk(match_id);
    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Check if rated user exists
    const ratedUser = await User.findByPk(rated_user_id);
    if (!ratedUser) {
      res.status(404).json({
        error: 'Rated user not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Prevent self-rating
    if (user.id === rated_user_id) {
      res.status(400).json({
        error: 'You cannot rate yourself',
        code: 'SELF_RATING_NOT_ALLOWED'
      });
      return;
    }

    // Only allow rating after match is completed
    if (match.status !== 'completed') {
      res.status(400).json({
        error: 'Ratings can only be given after the match is completed',
        code: 'MATCH_NOT_COMPLETED'
      });
      return;
    }

    // Check if both users participated in the match
    const raterParticipation = await UserMatch.findOne({
      where: { user_id: user.id, match_id: match_id }
    });

    const ratedUserParticipation = await UserMatch.findOne({
      where: { user_id: rated_user_id, match_id: match_id }
    });

    // Check if organizer is being rated
    const isRatingOrganizer = match.organizer_id === rated_user_id;

    if (!raterParticipation && match.organizer_id !== user.id) {
      res.status(403).json({
        error: 'You must have participated in this match to rate other participants',
        code: 'NOT_PARTICIPANT'
      });
      return;
    }

    if (!ratedUserParticipation && !isRatingOrganizer) {
      res.status(400).json({
        error: 'The user being rated did not participate in this match',
        code: 'USER_NOT_PARTICIPANT'
      });
      return;
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      where: {
        rater_id: user.id,
        rated_user_id: rated_user_id,
        match_id: match_id
      }
    });

    if (existingRating) {
      res.status(409).json({
        error: 'You have already rated this user for this match',
        code: 'RATING_ALREADY_EXISTS'
      });
      return;
    }

    // Create the rating
    const newRating = await Rating.create({
      rater_id: user.id,
      rated_user_id,
      match_id,
      rating,
      comment: comment?.trim() || undefined,
      rating_type: isRatingOrganizer ? 'organizer' : rating_type,
      is_anonymous
    });

    // Create a notification for the rated user
    await createNotification(
 io,
 rated_user_id,
 'rating_received',
 `You received a rating (${rating}/5) from ${is_anonymous ? 'an anonymous user' : `${user.first_name} ${user.last_name}`} for the match "${match.title}".`
    );


    // Update user's average rating
    const { avgRating, totalRatings } = await Rating.getUserAverageRating(rated_user_id);
    await ratedUser.update({
      avg_rating: avgRating,
      total_ratings: totalRatings
    });

    // Fetch the created rating with associations
    const createdRating = await Rating.findByPk(newRating.id, {
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url']
        },
        {
          model: User,
          as: 'ratedUser',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
        },
        {
          model: Match,
          as: 'match',
          attributes: ['id', 'title', 'scheduled_date']
        }
      ]
    });

    res.status(201).json({
      message: 'Rating created successfully',
      data: {
        rating: createdRating
      }
    });
  } catch (error) {
    console.error('Create rating error:', error);
    Sentry.captureException(error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err: ValidationErrorItem) => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while creating rating',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get ratings for a specific user
export const getUserRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;    const { page = 1, limit = 20, rating_type, sortBy = 'createdAt', sortOrder = 'DESC', minRating, maxRating } = req.query;
    const { page = 1, limit = 20, rating_type, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Build where clause
    const whereClause: any = {
      rated_user_id: userId
    };

    if (rating_type) {
      whereClause.rating_type = rating_type;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      whereClause.rating = {
        [Op.gte]: minRating !== undefined ? parseInt(minRating as string) : 1,
        [Op.lte]: maxRating !== undefined ? parseInt(maxRating as string) : 5,
      };
      if (minRating !== undefined) whereClause.rating[Op.gte] = parseInt(minRating as string);
      if (maxRating !== undefined) whereClause.rating[Op.lte] = parseInt(maxRating as string);

    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await Rating.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url']
        },
        {
          model: Match,
          as: 'match',
          attributes: ['id', 'title', 'scheduled_date', 'sport_id'],
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [
        sortBy === 'rating'
? ['rating', sortOrder as string]
          : ['created_at', 'DESC'],
      ],

      limit: parseInt(limit as string),
      offset
    });

    // Get user's average rating and stats
    const { avgRating, totalRatings } = await Rating.getUserAverageRating(userId);

    // Calculate rating distribution
    const ratingDistribution = await Rating.findAll({
      where: { rated_user_id: userId },
      attributes: [
        'rating',
        [Rating.sequelize!.fn('COUNT', Rating.sequelize!.col('id')), 'count']
      ],
      group: ['rating'],
      raw: true
    });

    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratingDistribution.forEach((item: any) => {
      distribution[item.rating as keyof typeof distribution] = parseInt(item.count);
    });

    res.status(200).json({
      message: 'User ratings retrieved successfully',
      data: {
        ratings: result.rows,
        stats: {
          avgRating,
          totalRatings,
          distribution
        },
        pagination: {
          total: result.count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.count / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user ratings',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get ratings for a specific match
export const getMatchRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;    const { page = 1, limit = 20 } = req.query;

    // Check if match exists
    const match = await Match.findByPk(matchId);
    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows: ratings } = await Rating.getMatchRatings(matchId, parseInt(limit as string), offset);

    res.status(200).json({
      message: 'Match ratings retrieved successfully',
      data: {
        ratings,
      },
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(count / parseInt(limit as string))


      }
    });
  } catch (error) {
    console.error('Get match ratings error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching match ratings',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Update a rating
export const updateRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { ratingId } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const rating = await Rating.findByPk(ratingId);
    if (!rating) {
      res.status(404).json({
        error: 'Rating not found',
        code: 'RATING_NOT_FOUND'
      });
      return;
    }

    // Check if user owns this rating
    if (rating.rater_id !== user.id) {
      res.status(403).json({
        error: 'You can only update your own ratings',
        code: 'PERMISSION_DENIED'
      });
      return;
    }

    const { rating: newRatingValue, comment, is_anonymous } = req.body;

    // Build update data
    const updateData: any = {};
    
    if (newRatingValue !== undefined) {
      if (newRatingValue < 1 || newRatingValue > 5) {
        res.status(400).json({
          error: 'Rating must be between 1 and 5',
          code: 'INVALID_RATING'
        });
        return;
      }
      updateData.rating = newRatingValue;
    }
    
    if (comment !== undefined) updateData.comment = comment?.trim() || null;
    if (is_anonymous !== undefined) updateData.is_anonymous = is_anonymous;

    await rating.update(updateData);

    // Update user's average rating if rating value changed
    if (newRatingValue !== undefined) {
      const { avgRating, totalRatings } = await Rating.getUserAverageRating(rating.rated_user_id);
      await User.update(
        { avg_rating: avgRating, total_ratings: totalRatings },
        { where: { id: rating.rated_user_id } }
      );
    }

    // Fetch updated rating with associations
    const updatedRating = await Rating.findByPk(rating.id, {
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url']
        },
        {
          model: User,
          as: 'ratedUser',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
        }
      ]
    });

    res.status(200).json({
      message: 'Rating updated successfully',
      data: {
        rating: updatedRating
      }
    });
  } catch (error) {
    console.error('Update rating error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err: ValidationErrorItem) => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while updating rating',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Delete a rating
export const deleteRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { ratingId } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const rating = await Rating.findByPk(ratingId);
    if (!rating) {
      res.status(404).json({
        error: 'Rating not found',
        code: 'RATING_NOT_FOUND'
      });
      return;
    }

    // Check if user owns this rating
    if (rating.rater_id !== user.id) {
      res.status(403).json({
        error: 'You can only delete your own ratings',
        code: 'PERMISSION_DENIED'
      });
      return;
    }

    const ratedUserId = rating.rated_user_id;
    await rating.destroy();

    // Update user's average rating
    const { avgRating, totalRatings } = await Rating.getUserAverageRating(ratedUserId);
    await User.update(
      { avg_rating: avgRating, total_ratings: totalRatings },
      { where: { id: ratedUserId } }
    );

    res.status(200).json({
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting rating',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get pending ratings for a user (matches they can rate)
export const getPendingRatings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Find completed matches where user participated but hasn't rated others yet
    const participatedMatches = await UserMatch.findAll({
      where: {
        user_id: user.id
      },
      include: [
        {
          model: Match,
          as: 'match',
          where: {
            status: 'completed'
          },
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'avg_rating']
            }
          ]
        }
      ]
    });

    const pendingRatings = [];

    for (const participation of participatedMatches) {
      const match = (participation as any).match;
      
      // Get all participants of this match
      const allParticipants = await UserMatch.findAll({
        where: {
          match_id: match.id
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'avg_rating']
          }
        ]
      });

      // Check who the user hasn't rated yet
      const unratedUsers = [];
      
      // Check organizer (if not the current user)
      if (match.organizer.id !== user.id) {
        const hasRatedOrganizer = await Rating.hasUserRatedInMatch(user.id, match.organizer.id, match.id);
        if (!hasRatedOrganizer) {
          unratedUsers.push({
            ...match.organizer.toJSON(),
            role: 'organizer'
          });
        }
      }

      // Check other participants
      for (const participant of allParticipants) {
        const participantUser = (participant as any).user;
        if (participantUser.id !== user.id && participantUser.id !== match.organizer.id) {
          const hasRated = await Rating.hasUserRatedInMatch(user.id, participantUser.id, match.id);
          if (!hasRated) {
            unratedUsers.push({
              ...participantUser.toJSON(),
              role: 'participant'
            });
          }
        }
      }

      if (unratedUsers.length > 0) {
        pendingRatings.push({
          match: {
            id: match.id,
            title: match.title,
            scheduled_date: match.scheduled_date,
            sport_id: match.sport_id
          },
          unratedUsers
        });
      }
    }

    res.status(200).json({
      message: 'Pending ratings retrieved successfully',
      data: {
        pendingRatings,
        count: pendingRatings.length
      }
    });
  } catch (error) {
    console.error('Get pending ratings error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching pending ratings',
      code: 'INTERNAL_ERROR'
    });
  }
};
