import { Request, Response } from 'express';
import { ValidationError } from 'sequelize';
import Sport from '../models/Sport';

// Get all sports
export const getAllSports = async (req: Request, res: Response): Promise<void> => {
  try {
    const sports = await Sport.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'min_players', 'max_players']
    });

    res.status(200).json({
      message: 'Sports retrieved successfully',
      data: {
        sports,
        count: sports.length
      }
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching sports',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get sport by ID
export const getSportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sport = await Sport.findByPk(id);

    if (!sport) {
      res.status(404).json({
        error: 'Sport not found',
        code: 'SPORT_NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      message: 'Sport retrieved successfully',
      data: {
        sport
      }
    });
  } catch (error) {
    console.error('Get sport by ID error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching sport',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Create new sport (Admin only - for future implementation)
export const createSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, min_players, max_players } = req.body;

    // Validate required fields
    if (!name || !min_players || !max_players) {
      res.status(400).json({
        error: 'Name, min_players, and max_players are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Check if sport already exists
    const existingSport = await Sport.findOne({ where: { name } });
    if (existingSport) {
      res.status(409).json({
        error: 'Sport with this name already exists',
        code: 'SPORT_EXISTS'
      });
      return;
    }

    // Create new sport
    const sport = await Sport.create({
      name,
      description,
      min_players: parseInt(min_players),
      max_players: parseInt(max_players)
    });

    res.status(201).json({
      message: 'Sport created successfully',
      data: {
        sport
      }
    });
  } catch (error) {
    console.error('Create sport error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while creating sport',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Update sport (Admin only - for future implementation)
export const updateSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, min_players, max_players } = req.body;

    const sport = await Sport.findByPk(id);

    if (!sport) {
      res.status(404).json({
        error: 'Sport not found',
        code: 'SPORT_NOT_FOUND'
      });
      return;
    }

    // Update sport fields (only provided fields)
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (min_players !== undefined) updateData.min_players = parseInt(min_players);
    if (max_players !== undefined) updateData.max_players = parseInt(max_players);

    await sport.update(updateData);

    res.status(200).json({
      message: 'Sport updated successfully',
      data: {
        sport
      }
    });
  } catch (error) {
    console.error('Update sport error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while updating sport',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Delete sport (Admin only - for future implementation)
export const deleteSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sport = await Sport.findByPk(id);

    if (!sport) {
      res.status(404).json({
        error: 'Sport not found',
        code: 'SPORT_NOT_FOUND'
      });
      return;
    }

    await sport.destroy();

    res.status(200).json({
      message: 'Sport deleted successfully'
    });
  } catch (error) {
    console.error('Delete sport error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting sport',
      code: 'INTERNAL_ERROR'
    });
  }
};
