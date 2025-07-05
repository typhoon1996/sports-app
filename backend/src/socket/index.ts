import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Match from '../models/Match';
import UserMatch from '../models/UserMatch';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface JoinRoomData {
  matchId: string;
}

interface ChatMessage {
  matchId: string;
  message: string;
  timestamp: Date;
}

interface ServerToClientEvents {
  newMessage: (data: {
    id: string;
    matchId: string;
    userId: string;
    userName: string;
    userEmail: string;
    message: string;
    timestamp: Date;
  }) => void;
  userJoinedMatch: (data: {
    matchId: string;
    userId: string;
    userName: string;
    userEmail: string;
  }) => void;
  userLeftMatch: (data: {
    matchId: string;
    userId: string;
    userName: string;
    userEmail: string;
  }) => void;
  participantUpdate: (data: {
    matchId: string;
    participantCount: number;
  }) => void;
}

interface ClientToServerEvents {
  authenticate: (token: string) => void;
  joinMatch: (data: JoinRoomData) => void;
  leaveMatch: (data: JoinRoomData) => void;
  sendMessage: (data: ChatMessage) => void;
}

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userEmail = user.email;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userEmail} (${socket.userId})`);

    // Join match room
    socket.on('joinMatch', async (data: JoinRoomData) => {
      try {
        const { matchId } = data;
        
        // Verify user is participant in the match
        const participation = await UserMatch.findOne({
          where: { user_id: socket.userId, match_id: matchId }
        });

        if (!participation) {
          socket.emit('error', { message: 'Not authorized to join this match' });
          return;
        }

        // Join the match room
        socket.join(`match:${matchId}`);
        
        // Get user details
        const user = await User.findByPk(socket.userId);
        
        // Notify other participants
        socket.to(`match:${matchId}`).emit('userJoinedMatch', {
          matchId,
          userId: socket.userId!,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'Unknown'
        });

        console.log(`👥 User ${socket.userEmail} joined match ${matchId}`);
      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    // Leave match room
    socket.on('leaveMatch', async (data: JoinRoomData) => {
      try {
        const { matchId } = data;
        
        // Leave the match room
        socket.leave(`match:${matchId}`);
        
        // Get user details
        const user = await User.findByPk(socket.userId);
        
        // Notify other participants
        socket.to(`match:${matchId}`).emit('userLeftMatch', {
          matchId,
          userId: socket.userId!,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'Unknown'
        });

        console.log(`👋 User ${socket.userEmail} left match ${matchId}`);
      } catch (error) {
        console.error('Error leaving match:', error);
        socket.emit('error', { message: 'Failed to leave match' });
      }
    });

    // Handle chat messages
    socket.on('sendMessage', async (data: ChatMessage) => {
      try {
        const { matchId, message } = data;
        
        // Verify user is participant in the match
        const participation = await UserMatch.findOne({
          where: { user_id: socket.userId, match_id: matchId }
        });

        if (!participation) {
          socket.emit('error', { message: 'Not authorized to send messages to this match' });
          return;
        }

        // Get user details
        const user = await User.findByPk(socket.userId);
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Create message object
        const messageData = {
          id: generateMessageId(),
          matchId,
          userId: socket.userId!,
          userName: `${user.first_name} ${user.last_name}`,
          userEmail: user.email,
          message: message.trim(),
          timestamp: new Date()
        };

        // Send message to all participants in the match
        io.to(`match:${matchId}`).emit('newMessage', messageData);
        
        console.log(`💬 Message sent in match ${matchId} by ${user.email}: ${message}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userEmail} (${socket.userId})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${socket.userEmail}:`, error);
    });
  });
};

// Utility function to generate message IDs
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to broadcast match updates
export const broadcastMatchUpdate = (io: Server, matchId: string, participantCount: number) => {
  io.to(`match:${matchId}`).emit('participantUpdate', {
    matchId,
    participantCount
  });
};
