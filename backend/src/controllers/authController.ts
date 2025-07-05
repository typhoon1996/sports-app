import { Request, Response } from 'express';
import { ValidationError } from 'sequelize';
import User from '../models/User';
import { generateToken, AuthenticatedRequest } from '../utils/jwt';

// Validation helper
const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

// User registration
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone,
      bio,
      location,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      res.status(400).json({
        error: 'Email, password, first name, and last name are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      res.status(400).json({
        error: 'Password validation failed',
        details: passwordErrors,
        code: 'PASSWORD_WEAK'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        error: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      email,
      password_hash: password, // Will be hashed by the model hook
      first_name,
      last_name,
      phone,
      bio,
      location,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error during signup',
      code: 'INTERNAL_ERROR'
    });
  }
};

// User login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Find user by email (include password for validation)
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'AUTH_INVALID'
      });
      return;
    }

    // Check if user account is active
    if (!user.is_active) {
      res.status(401).json({
        error: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'AUTH_INVALID'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      first_name,
      last_name,
      phone,
      bio,
      location,
      latitude,
      longitude,
      profile_picture_url
    } = req.body;

    // Update user fields (only provided fields)
    const updateData: any = {};
    
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;

    await user.update(updateData);

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error while updating profile',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Change password
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const { current_password, new_password } = req.body;

    // Validate required fields
    if (!current_password || !new_password) {
      res.status(400).json({
        error: 'Current password and new password are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Get user with password for validation
    const userWithPassword = await User.scope('withPassword').findByPk(user.id);
    if (!userWithPassword) {
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Validate current password
    const isValidCurrentPassword = await userWithPassword.validatePassword(current_password);
    if (!isValidCurrentPassword) {
      res.status(401).json({
        error: 'Current password is incorrect',
        code: 'AUTH_INVALID'
      });
      return;
    }

    // Validate new password strength
    const passwordErrors = validatePassword(new_password);
    if (passwordErrors.length > 0) {
      res.status(400).json({
        error: 'New password validation failed',
        details: passwordErrors,
        code: 'PASSWORD_WEAK'
      });
      return;
    }

    // Update password
    await userWithPassword.update({ password_hash: new_password });

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error while changing password',
      code: 'INTERNAL_ERROR'
    });
  }
};
