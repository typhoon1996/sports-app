import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Match from '../models/Match';
import UserMatch from '../models/UserMatch';
import { createNotification } from '../utils/notificationUtils';
import { Op } from 'sequelize';
import Friendship from '../models/Friendship';
// import { socketAuthMiddleware } from '../middleware/socketAuth'; // Import from the new middleware file
import { isBlocked } from '../utils/friendshipUtils';
import { getUserById } from '../utils/userUtils';
import { getMatchParticipants as getMatchParticipantsUtil } from '../utils/matchUtils';
import { UnauthorizedError } from '../utils/errors';

// Map to store userId to an array of socket IDs
const userSocketMap: Map<string, string[]> = new Map();

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

      // Add socket ID to the user's entry in the map
      if (socket.userId) {
        if (!userSocketMap.has(socket.userId)) {
          userSocketMap.set(socket.userId, []);
        }
        userSocketMap.get(socket.userId)!.push(socket.id);
      }

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
        
        // This will throw UnauthorizedError if not participant
 await isUserMatchParticipant(socket.userId!, matchId);
        
        // Join the match room
        socket.join(`match:${matchId}`);
        
        // Get user details
        const user = await getUserById(socket.userId!);
        
        // Notify other participants
        socket.to(`match:${matchId}`).emit('userJoinedMatch', {
          matchId,
          userId: socket.userId!,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'Unknown'
        });

        console.log(`👥 User ${socket.userEmail} joined match ${matchId}`);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          socket.emit('error', { message: error.message });
        } else {
        console.error('Error joining match:', error);
        socket.emit('error', { message: 'Failed to join match' });
        }
      }
    });

    // Leave match room
    socket.on('leaveMatch', async (data: JoinRoomData) => {
      try {
        const { matchId } = data;
        
        // Leave the match room
        socket.leave(`match:${matchId}`);
        
        // Get user details
        const user = await getUserById(socket.userId!);
        
        // Notify other participants
        socket.to(`match:${matchId}`).emit('userLeftMatch', {
          matchId,
          userId: socket.userId!,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'Unknown'
        });

        console.log(`👋 User ${socket.userEmail} left match ${matchId}`);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          socket.emit('error', { message: error.message });
        } else {
        console.error('Error joining match:', error);
        socket.emit('error', { message: 'Failed to join match' });
        }
      }
    });

    // Handle chat messages
    socket.on('sendMessage', async (data: ChatMessage) => {
      try {
        const { matchId, message } = data;
        
        // This will throw UnauthorizedError if not participant
 await isUserMatchParticipant(socket.userId!, matchId);
        
        // Get user details
        const user = await getUserById(socket.userId!);
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Check if the sender is blocked by any participant in the match, or vice versa
        const participantsIds = (await UserMatch.findAll({ where: { match_id: matchId, participation_status: 'confirmed' }, attributes: ['user_id'] })).map(p => p.user_id);
        
        const blockedRelationship = await Friendship.findOne({
          where: {
            [Op.or]: [
              { sender_id: socket.userId, receiver_id: { [Op.in]: participantsIds } },
              { sender_id: { [Op.in]: participantsIds }, receiver_id: socket.userId },
            ],
            status: 'blocked',
          },
        });

        if (blockedRelationship) {
          socket.emit('error', { message: 'Cannot send message due to a blocked relationship.' });
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

        // Create notifications for other participants
        const participantIdsForNotification = await getMatchParticipantsUtil(matchId, socket.userId!);

        const match = await Match.findByPk(matchId, { attributes: ['title'] });
        const matchTitle = match ? match.title : 'a match';

        for (const participant of participants) {
        for (const participantId of participantIdsForNotification) {
 await createNotification(io, participantId, 'new_message', `${user.first_name} ${user.last_name} sent a message in ${matchTitle}.`);
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          socket.emit('error', { message: error.message });
        } else {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove socket ID from the user's entry in the map
      if (socket.userId) {
        const sockets = userSocketMap.get(socket.userId);
        if (sockets) {
          const index = sockets.indexOf(socket.id);
          if (index !== -1) {
            sockets.splice(index, 1);
          }
        }
      }
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

// Utility function to emit notifications to a specific user
export const emitNotificationToUser = (io: Server, userId: string, notificationData: any) => {
  const socketIds = userSocketMap.get(userId);
  if (socketIds && socketIds.length > 0) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit('newNotification', notificationData);
    });
    console.log(`✉️ Emitted newNotification to user ${userId} on ${socketIds.length} sockets`);
  } else {
    console.log(`⚠️ No active sockets found for user ${userId}. Notification will only be stored in DB.`);
  }
};

// Helper function to check if a user is a confirmed participant in a match
const isUserMatchParticipant = async (userId: string, matchId: string): Promise<boolean> => {
  const participation = await UserMatch.findOne({
    where: { user_id: userId, match_id: matchId, participation_status: 'confirmed' }
  });
  if (!participation) {
 throw new UnauthorizedError('User is not a confirmed participant in this match.');
  }
  return true;
};





