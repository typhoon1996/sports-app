import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { UnauthorizedError } from './errors'; // Import custom error class

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extended Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Helper function to get the JWT secret
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};
// Generate JWT token
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  };

  const secret = getJwtSecret();

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as any);
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {  const secret = getJwtSecret();

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token'); // Throw custom error
  }
};

// Authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token is required',
        code: 'AUTH_TOKEN_MISSING'
      });
      return;
    }

    const decoded = verifyToken(token);
    
    // Find user by ID from token
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'AUTH_USER_INVALID'
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Generate refresh token (for future implementation)
export const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  const secret = getJwtSecret();

  return jwt.sign(payload, secret, { expiresIn: '30d' } as any);
};
