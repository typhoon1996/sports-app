import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Assuming User model path

// Define the AuthenticatedSocket interface if not already defined elsewhere
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: any) => void) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Assuming your JWT secret is stored in process.env.JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;

    // Note: The userSocketMap logic remains in index.ts as it's coupled with the Socket.io server instance
    // You might need to adjust how userSocketMap is updated if moving this middleware

    next();
  } catch (error) {
    // Log the error for debugging
    console.error('Socket authentication failed:', error);
    next(new Error('Authentication failed'));
  }
};