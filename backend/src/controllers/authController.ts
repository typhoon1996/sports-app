import { Request, Response } from 'express';
import { ValidationError } from 'sequelize';
import User from '../models/User';
import { body, validationResult } from 'express-validator';
import { generateToken, AuthenticatedRequest } from '../utils/jwt';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique filenames

// Configure AWS SDK with environment variables
AWS.config.update({
  region: process.env.AWS_REGION,
});

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
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});



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

// Get current user profile (authenticated user)
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

// Update user profile (authenticated user)
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

// Change password (authenticated user)
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

export const getUserNotificationPreferences = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['notification_preferences'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const preferences = user.notification_preferences || { /* Default preferences here */ };

    res.status(200).json({
      message: 'Notification preferences retrieved successfully',
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateUserNotificationPreferences = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const preferences = req.body;

    // Basic validation: ensure preferences is an object
    if (typeof preferences !== 'object' || preferences === null) {
      return res.status(400).json({ message: 'Invalid preferences data.' });
    }

    await user.update({ notification_preferences: preferences });

    res.status(200).json({ message: 'Notification preferences updated successfully.' });
  } catch (error) {
    console.error('Error updating user notification preferences:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
export const getUserProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password_hash', 'google_id', 'facebook_id', 'provider', 'provider_id']
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Provide a default profile picture if none is set
    if (!user.profile_picture_url) {
      // Replace with the actual URL of your default profile picture in S3
      user.profile_picture_url = process.env.DEFAULT_PROFILE_PICTURE_URL || ''; 
    }

    res.status(200).json(user.toJSON());
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateUserProfile = [
  body('first_name').optional().notEmpty().isString().isLength({ max: 100 }),
  body('last_name').optional().notEmpty().isString().isLength({ max: 100 }),
  body('phone').optional().isString().isLength({ max: 20 }), // Basic length validation for phone
  body('bio').optional().isString().isLength({ max: 500 }),
  body('profile_picture_url').optional().isURL(),
], async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
 return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { first_name, last_name, phone, bio, location, profile_picture_url } = req.body;

    // Update user fields
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;


    // Function to extract S3 key from URL
    const getS3KeyFromUrl = (url: string | undefined): string | null => {
      if (!url) return null;
      try {
        const urlParts = new URL(url);
        // Assumes S3 URLs are in the format https://bucket-name.s3.region.amazonaws.com/key
        // Or https://s3.region.amazonaws.com/bucket-name/key
        return urlParts.pathname.substring(1); // Remove leading '/'
      } catch (e) {
        return null; // Not a valid URL
      }
    };


    if (req.file) {
      // Handle file upload
      const file = req.file;
      try {
        const resizedImageBuffer = await sharp(file.buffer)
          .resize(200, 200, { fit: 'cover' })
          .toFormat('jpeg')
          .toBuffer();

        // Delete old profile picture if it exists in S3
        if (user.profile_picture_url) {
          const oldS3Key = getS3KeyFromUrl(user.profile_picture_url);
          if (oldS3Key && oldS3Key.startsWith('profile-pictures/')) { // Ensure it's a picture uploaded via this feature
            try {
              const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME || '',
                Key: oldS3Key,
              };
              await s3.deleteObject(deleteParams).promise();
            } catch (deleteError) {
              console.error('Error deleting old profile picture from S3:', deleteError);
              // Continue with the new upload even if old deletion fails
            }
          }
        }

        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME || '',
          Key: `profile-pictures/${userId}/${uuidv4()}.jpeg`, // Unique filename using user ID and UUID
          Body: resizedImageBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read' // Or adjust permissions based on your needs
        };
        
        const uploadResult = await s3.upload(uploadParams).promise();
        user.profile_picture_url = uploadResult.Location; // S3 object URL

      } catch (error) {
        console.error('Error processing or uploading profile picture:', error);
        return res.status(500).json({ message: 'Error processing or uploading profile picture.' });
      }
    } else if (profile_picture_url !== undefined) {
      user.profile_picture_url = profile_picture_url || user.profile_picture_url;
    }
    await user.save();
    res.status(200).json(user.toJSON()); // Return the updated user object (without password hash)
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error while updating profile.' });
  }
};
