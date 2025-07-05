'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { socketService, ChatMessage, MatchParticipantUpdate, ParticipantCountUpdate } from '@/lib/socket';

export const useSocket = () => {
  const { token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const socket = socketService.connect(token);
      
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socket?.on('connect', handleConnect);
      socket?.on('disconnect', handleDisconnect);
      
      setIsConnected(socket?.connected || false);

      return () => {
        socket?.off('connect', handleConnect);
        socket?.off('disconnect', handleDisconnect);
      };
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [token]);

  const joinMatch = useCallback((matchId: string) => {
    socketService.joinMatch(matchId);
  }, []);

  const leaveMatch = useCallback((matchId: string) => {
    socketService.leaveMatch(matchId);
  }, []);

  const sendMessage = useCallback((matchId: string, message: string) => {
    socketService.sendMessage(matchId, message);
  }, []);

  return {
    isConnected,
    joinMatch,
    leaveMatch,
    sendMessage,
    socketService
  };
};

export const useMatchChat = (matchId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { isConnected, joinMatch, leaveMatch, sendMessage } = useSocket();

  useEffect(() => {
    if (isConnected && matchId) {
      joinMatch(matchId);
      
      const handleNewMessage = (message: ChatMessage) => {
        if (message.matchId === matchId) {
          setMessages(prev => [...prev, message]);
        }
      };

      const handleUserJoined = (data: MatchParticipantUpdate) => {
        if (data.matchId === matchId) {
          // Add a system message for user joining
          const systemMessage: ChatMessage = {
            id: `system_${Date.now()}`,
            matchId: data.matchId,
            userId: 'system',
            userName: 'System',
            userEmail: '',
            message: `${data.userName} joined the match`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
        }
      };

      const handleUserLeft = (data: MatchParticipantUpdate) => {
        if (data.matchId === matchId) {
          // Add a system message for user leaving
          const systemMessage: ChatMessage = {
            id: `system_${Date.now()}`,
            matchId: data.matchId,
            userId: 'system',
            userName: 'System',
            userEmail: '',
            message: `${data.userName} left the match`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
        }
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onUserJoined(handleUserJoined);
      socketService.onUserLeft(handleUserLeft);

      return () => {
        socketService.offNewMessage(handleNewMessage);
        socketService.offUserJoined(handleUserJoined);
        socketService.offUserLeft(handleUserLeft);
        leaveMatch(matchId);
      };
    }
  }, [isConnected, matchId, joinMatch, leaveMatch]);

  const sendChatMessage = useCallback((message: string) => {
    if (message.trim() && matchId) {
      sendMessage(matchId, message);
    }
  }, [matchId, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage: sendChatMessage,
    clearMessages,
    isConnected
  };
};

export const useMatchParticipants = (matchId: string) => {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (isConnected && matchId) {
      const handleParticipantUpdate = (data: ParticipantCountUpdate) => {
        if (data.matchId === matchId) {
          setParticipantCount(data.participantCount);
        }
      };

      socketService.onParticipantUpdate(handleParticipantUpdate);

      return () => {
        socketService.offParticipantUpdate(handleParticipantUpdate);
      };
    }
  }, [isConnected, matchId]);

  return {
    participantCount,
    isConnected
  };
};
