import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  timestamp: Date;
}

export interface MatchParticipantUpdate {
  matchId: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface ParticipantCountUpdate {
  matchId: string;
  participantCount: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(token: string) {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  joinMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('joinMatch', { matchId });
    }
  }

  leaveMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaveMatch', { matchId });
    }
  }

  sendMessage(matchId: string, message: string) {
    if (this.socket?.connected && message.trim()) {
      this.socket.emit('sendMessage', {
        matchId,
        message: message.trim(),
        timestamp: new Date()
      });
    }
  }

  onNewMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  onUserJoined(callback: (data: MatchParticipantUpdate) => void) {
    if (this.socket) {
      this.socket.on('userJoinedMatch', callback);
    }
  }

  onUserLeft(callback: (data: MatchParticipantUpdate) => void) {
    if (this.socket) {
      this.socket.on('userLeftMatch', callback);
    }
  }

  onParticipantUpdate(callback: (data: ParticipantCountUpdate) => void) {
    if (this.socket) {
      this.socket.on('participantUpdate', callback);
    }
  }

  offNewMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.off('newMessage', callback);
    }
  }

  offUserJoined(callback: (data: MatchParticipantUpdate) => void) {
    if (this.socket) {
      this.socket.off('userJoinedMatch', callback);
    }
  }

  offUserLeft(callback: (data: MatchParticipantUpdate) => void) {
    if (this.socket) {
      this.socket.off('userLeftMatch', callback);
    }
  }

  offParticipantUpdate(callback: (data: ParticipantCountUpdate) => void) {
    if (this.socket) {
      this.socket.off('participantUpdate', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
