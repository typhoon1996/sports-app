'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Users, Wifi, WifiOff, X, Minimize2, Maximize2 } from 'lucide-react';
import { useMatchChat } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import Button from './Button';
import Input from './Input';

interface MatchChatProps {
  matchId: string;
  className?: string;
  inline?: boolean; // New prop for inline display
}

export default function MatchChat({ matchId, className = '', inline = false }: MatchChatProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, isConnected } = useMatchChat(matchId);
  const { user } = useAuthStore();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      sendMessage(message);
      setMessage('');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const isOwnMessage = (messageUserId: string) => {
    return user?.id === messageUserId;
  };

  const isSystemMessage = (messageUserId: string) => {
    return messageUserId === 'system';
  };

  // Skip floating button for inline mode
  if (!isExpanded && !inline) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
              {messages.length}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`${inline ? 'w-full' : 'fixed bottom-4 right-4 w-80 max-w-full z-50'} bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Match Chat</h3>
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        {!inline && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                isOwnMessage(msg.userId) ? 'justify-end' : 'justify-start'
              } ${isSystemMessage(msg.userId) ? 'justify-center' : ''}`}
            >
              {isSystemMessage(msg.userId) ? (
                <div className="text-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    isOwnMessage(msg.userId)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isOwnMessage(msg.userId) && (
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {msg.userName}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage(msg.userId) ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {!isConnected && (
          <div className="mb-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            Connecting to chat...
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={!message.trim() || !isConnected}
            size="sm"
            className="flex items-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {message.length > 450 && (
          <div className="text-xs text-gray-500 mt-1">
            {500 - message.length} characters remaining
          </div>
        )}
      </div>
    </div>
  );
}
