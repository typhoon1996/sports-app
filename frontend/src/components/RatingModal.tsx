'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, User, MessageSquare, Award } from 'lucide-react';
import Button from './Button';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, isAnonymous: boolean) => Promise<void>;
  userToRate: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    avg_rating: number;
    role: 'organizer' | 'participant';
  };
  matchTitle: string;
  isSubmitting?: boolean;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  userToRate,
  matchTitle,
  isSubmitting = false
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setError(null);
      await onSubmit(rating, comment.trim(), isAnonymous);
      
      // Reset form
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setIsAnonymous(false);
      
      onClose();
    } catch (error: any) {
      setError(error.error || 'Failed to submit rating');
    }
  };

  const handleStarClick = (value: number) => {
    setRating(value);
    setError(null);
  };

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const getRatingLabel = (value: number) => {
    if (value === 0) return '';
    if (value <= 2) return 'Poor';
    if (value <= 3) return 'Fair';
    if (value <= 4) return 'Good';
    return 'Excellent';
  };

  const getStarColor = (index: number) => {
    const activeRating = hoveredRating || rating;
    if (index <= activeRating) {
      if (activeRating <= 2) return 'text-danger';
      if (activeRating <= 3) return 'text-warning';
      return 'text-success';
    }
    return 'text-gray-300 dark:text-gray-600';
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" onClick={onClose} />
      
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Rate Player
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{matchTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* User Info */}
            <div className="flex items-center mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800">
                {userToRate.profile_picture_url ? (
                  <img
                    src={userToRate.profile_picture_url}
                    alt={userToRate.first_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900 dark:text-white">
                  {userToRate.first_name} {userToRate.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {userToRate.role}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Star className="h-3 w-3 mr-1 fill-current text-warning" />
                  {userToRate.avg_rating.toFixed(1)} current rating
                </div>
              </div>
            </div>

          {/* Rating Stars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How was your experience with this {userToRate.role}?
            </label>
            <div className="flex items-center justify-center space-x-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className={`p-2 transition-all duration-200 ${getStarColor(star)} hover:scale-110 transform rounded-full hover:bg-gray-100 dark:hover:bg-gray-700`}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-200 ${
                      star <= (hoveredRating || rating) ? 'fill-current' : ''
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {getRatingLabel(hoveredRating || rating)}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment (optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this player..."
                rows={3}
                maxLength={1000}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/1000 characters
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded transition-colors"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Submit this rating anonymously
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your name won't be shown with this rating
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
