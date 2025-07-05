import { Request, Response } from 'express';
import { ValidationError, ValidationErrorItem } from 'sequelize';
import User from '../models/User';
import Match from '../models/Match';
import UserMatch from '../models/UserMatch';
import Sport from '../models/Sport';
import { AuthenticatedRequest } from '../utils/jwt';

interface UserMatchWithMatch extends UserMatch {
  match: Match;
}

interface UserMatchWithUser extends UserMatch {
  user: User;
}

// Get all matches with filtering and pagination
export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sport_id,
      skill_level,
      date,
      latitude,
      longitude,
      radius = 10,
      status = 'upcoming',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause for filtering
    const whereClause: any = {
      status: status as string,
      is_public: true
    };

    if (sport_id) {
      whereClause.sport_id = sport_id;
    }

    if (skill_level) {
      whereClause.required_skill_level = skill_level;
    }

    if (date) {
      whereClause.scheduled_date = date;
    }

    // Calculate offset for pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let matches;
    let total;

    // If location is provided, use proximity search
    if (latitude && longitude) {
      matches = await Match.findNearby(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseInt(radius as string)
      );
      
      // Apply additional filters to nearby matches
      matches = matches.filter(match => {
        if (sport_id && match.sport_id !== sport_id) return false;
        if (skill_level && match.required_skill_level !== skill_level) return false;
        if (date && match.scheduled_date !== date) return false;
        return true;
      });

      total = matches.length;
      
      // Apply pagination
      matches = matches.slice(offset, offset + parseInt(limit as string));

      // Load associations for the filtered matches
      for (let i = 0; i < matches.length; i++) {
        const fullMatch = await Match.findByPk(matches[i].id, {
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
            },
            {
              model: Sport,
              as: 'sport',
              attributes: ['id', 'name', 'min_players', 'max_players']
            }
          ]
        });
        if (fullMatch) {
          matches[i] = fullMatch;
        }
      }
    } else {
      // Regular search without proximity
      const result = await Match.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
          },
          {
            model: Sport,
            as: 'sport',
            attributes: ['id', 'name', 'min_players', 'max_players']
          }
        ],
        order: [['scheduled_date', 'ASC'], ['start_time', 'ASC']],
        limit: parseInt(limit as string),
        offset
      });

      matches = result.rows;
      total = result.count;
    }

    res.status(200).json({
      message: 'Matches retrieved successfully',
      data: {
        matches,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching matches',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get match by ID
export const getMatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const match = await Match.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings', 'phone']
        },
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'description', 'min_players', 'max_players']
        }
      ]
    });

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      message: 'Match retrieved successfully',
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Get match by ID error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get match details with participants (for match detail page)
export const getMatchDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const match = await Match.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings', 'phone', 'profile_picture_url']
        },
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'description', 'min_players', 'max_players']
        }
      ]
    });

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Get participants
    const participations = await UserMatch.findAll({
      where: {
        match_id: id,
        participation_status: 'confirmed'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings', 'profile_picture_url']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    const participants = participations.map(p => (p as UserMatchWithUser).user);
    
    // Add organizer to participants if not already included
    const organizerInParticipants = participants.find(p => p.id === match.organizer.id);
    if (!organizerInParticipants) {
      participants.unshift(match.organizer);
    }

    // Update current_players count
    const actualPlayerCount = participants.length;
    if (match.current_players !== actualPlayerCount) {
      await match.update({ current_players: actualPlayerCount });
      match.current_players = actualPlayerCount;
    }

    res.status(200).json({
      message: 'Match details retrieved successfully',
      data: {
        ...match.toJSON(),
        participants
      }
    });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching match details',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Create new match
export const createMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const {
      sport_id,
      title,
      description,
      location,
      latitude,
      longitude,
      scheduled_date,
      start_time,
      end_time,
      max_players,
      required_skill_level = 'beginner',
      cost = 0,
      is_public = true
    } = req.body;

    // Validate required fields
    if (!sport_id || !title || !location || !latitude || !longitude || 
        !scheduled_date || !start_time || !max_players) {
      res.status(400).json({
        error: 'Missing required fields: sport_id, title, location, latitude, longitude, scheduled_date, start_time, max_players',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Validate that sport exists
    const sport = await Sport.findByPk(sport_id);
    if (!sport) {
      res.status(400).json({
        error: 'Invalid sport_id',
        code: 'SPORT_NOT_FOUND'
      });
      return;
    }

    // Validate max_players against sport constraints
    if (max_players < sport.min_players || max_players > sport.max_players) {
      res.status(400).json({
        error: `Max players for ${sport.name} must be between ${sport.min_players} and ${sport.max_players}`,
        code: 'INVALID_PLAYER_COUNT'
      });
      return;
    }

    // Validate date is not in the past
    const matchDate = new Date(`${scheduled_date}T${start_time}`);
    if (matchDate <= new Date()) {
      res.status(400).json({
        error: 'Match date and time must be in the future',
        code: 'INVALID_DATE'
      });
      return;
    }

    // Create new match
    const match = await Match.create({
      organizer_id: user.id,
      sport_id,
      title,
      description,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      scheduled_date,
      start_time,
      end_time,
      max_players: parseInt(max_players),
      required_skill_level,
      cost: parseFloat(cost) || 0,
      is_public: Boolean(is_public)
    });

    // Fetch the created match with associations
    const createdMatch = await Match.findByPk(match.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
        },
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'min_players', 'max_players']
        }
      ]
    });

    res.status(201).json({
      message: 'Match created successfully',
      data: {
        match: createdMatch
      }
    });
  } catch (error) {
    console.error('Create match error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err: ValidationErrorItem) => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while creating match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Update match (only organizer can update)
export const updateMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const match = await Match.findByPk(id);

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Check if user is the organizer
    if (match.organizer_id !== user.id) {
      res.status(403).json({
        error: 'Only the match organizer can update this match',
        code: 'PERMISSION_DENIED'
      });
      return;
    }

    // Don't allow updates to completed or cancelled matches
    if (match.status === 'completed' || match.status === 'cancelled') {
      res.status(400).json({
        error: 'Cannot update completed or cancelled matches',
        code: 'INVALID_MATCH_STATUS'
      });
      return;
    }

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      scheduled_date,
      start_time,
      end_time,
      max_players,
      required_skill_level,
      cost,
      status,
      is_public
    } = req.body;

    // Build update data (only provided fields)
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (max_players !== undefined) updateData.max_players = parseInt(max_players);
    if (required_skill_level !== undefined) updateData.required_skill_level = required_skill_level;
    if (cost !== undefined) updateData.cost = parseFloat(cost);
    if (status !== undefined) updateData.status = status;
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);

    // Validate max_players if being updated
    if (max_players !== undefined) {
      if (parseInt(max_players) < match.current_players) {
        res.status(400).json({
          error: 'Cannot set max players below current player count',
          code: 'INVALID_PLAYER_COUNT'
        });
        return;
      }
    }

    await match.update(updateData);

    // Fetch updated match with associations
    const updatedMatch = await Match.findByPk(match.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'first_name', 'last_name', 'avg_rating', 'total_ratings']
        },
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'min_players', 'max_players']
        }
      ]
    });

    res.status(200).json({
      message: 'Match updated successfully',
      data: {
        match: updatedMatch
      }
    });
  } catch (error) {
    console.error('Update match error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((err: ValidationErrorItem) => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while updating match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Delete match (only organizer can delete)
export const deleteMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const match = await Match.findByPk(id);

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Check if user is the organizer
    if (match.organizer_id !== user.id) {
      res.status(403).json({
        error: 'Only the match organizer can delete this match',
        code: 'PERMISSION_DENIED'
      });
      return;
    }

    // Don't allow deletion of ongoing or completed matches
    if (match.status === 'ongoing' || match.status === 'completed') {
      res.status(400).json({
        error: 'Cannot delete ongoing or completed matches',
        code: 'INVALID_MATCH_STATUS'
      });
      return;
    }

    await match.destroy();

    res.status(200).json({
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get user's organized matches
export const getUserMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const whereClause: any = {
      organizer_id: user.id
    };

    if (status) {
      whereClause.status = status;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await Match.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'min_players', 'max_players']
        }
      ],
      order: [['scheduled_date', 'DESC'], ['start_time', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.status(200).json({
      message: 'User matches retrieved successfully',
      data: {
        matches: result.rows,
        pagination: {
          total: result.count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.count / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get user matches error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user matches',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Join a match
export const joinMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { matchId } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Check if match exists
    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'min_players', 'max_players']
        }
      ]
    });

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Check if user is the organizer
    if (match.organizer_id === user.id) {
      res.status(400).json({
        error: 'Match organizer cannot join their own match',
        code: 'ORGANIZER_CANNOT_JOIN'
      });
      return;
    }

    // Check if match is open for joining
    if (match.status !== 'upcoming') {
      res.status(400).json({
        error: 'Match is not open for joining',
        code: 'MATCH_NOT_OPEN'
      });
      return;
    }

    // Check if user is already participating
    const existingParticipation = await UserMatch.findOne({
      where: {
        user_id: user.id,
        match_id: matchId
      }
    });

    if (existingParticipation) {
      res.status(400).json({
        error: 'User is already participating in this match',
        code: 'ALREADY_PARTICIPATING'
      });
      return;
    }

    // Check if match has reached capacity
    const currentParticipants = await UserMatch.count({
      where: {
        match_id: matchId,
        participation_status: 'confirmed'
      }
    });

    if (currentParticipants >= match.max_players) {
      res.status(400).json({
        error: 'Match has reached maximum capacity',
        code: 'MATCH_FULL'
      });
      return;
    }

    // Create participation record
    const participation = await UserMatch.create({
      user_id: user.id,
      match_id: matchId,
      participation_status: 'confirmed'
    });

    res.status(201).json({
      message: 'Successfully joined the match',
      data: {
        participation
      }
    });
  } catch (error) {
    console.error('Join match error:', error);
    res.status(500).json({
      error: 'Internal server error while joining match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Leave a match
export const leaveMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { matchId } = req.params;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Check if match exists
    const match = await Match.findByPk(matchId);

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    // Check if user is participating
    const participation = await UserMatch.findOne({
      where: {
        user_id: user.id,
        match_id: matchId
      }
    });

    if (!participation) {
      res.status(404).json({
        error: 'User is not participating in this match',
        code: 'NOT_PARTICIPATING'
      });
      return;
    }

    // Don't allow leaving if match is ongoing or completed
    if (match.status === 'ongoing' || match.status === 'completed') {
      res.status(400).json({
        error: 'Cannot leave ongoing or completed matches',
        code: 'INVALID_MATCH_STATUS'
      });
      return;
    }

    // Remove participation record
    await participation.destroy();

    res.status(200).json({
      message: 'Successfully left the match'
    });
  } catch (error) {
    console.error('Leave match error:', error);
    res.status(500).json({
      error: 'Internal server error while leaving match',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get user's participating matches
export const getUserParticipatingMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    // Build where clause for match filtering
    const matchWhereClause: any = {};
    if (status) {
      matchWhereClause.status = status;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await UserMatch.findAndCountAll({
      where: {
        user_id: user.id,
        participation_status: 'confirmed'
      },
      include: [
        {
          model: Match,
          as: 'match',
          where: matchWhereClause,
          include: [
            {
              model: Sport,
              as: 'sport',
              attributes: ['id', 'name', 'min_players', 'max_players']
            },
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'username', 'email']
            }
          ]
        }
      ],
      order: [['match', 'scheduled_date', 'DESC'], ['match', 'start_time', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.status(200).json({
      message: 'User participating matches retrieved successfully',
      data: {
        matches: result.rows.map(participation => (participation as UserMatchWithMatch).match),
        pagination: {
          total: result.count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.count / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get user participating matches error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user participating matches',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get match participants
export const getMatchParticipants = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    
    // Check if match exists
    const match = await Match.findByPk(matchId);

    if (!match) {
      res.status(404).json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
      return;
    }

    const participants = await UserMatch.findAll({
      where: {
        match_id: matchId,
        participation_status: 'confirmed'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      message: 'Match participants retrieved successfully',
      data: {
        participants: participants.map(participation => (participation as UserMatchWithUser).user),
        count: participants.length
      }
    });
  } catch (error) {
    console.error('Get match participants error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching match participants',
      code: 'INTERNAL_ERROR'
    });
  }
};
