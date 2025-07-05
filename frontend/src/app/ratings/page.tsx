'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Star, Users, CheckCircle, AlertCircle } from 'lucide-react';

import Button from '@/components/Button';
import RatingModal from '@/components/RatingModal';
import { useAuthStore } from '@/store/authStore';
import { ratingsService, PendingRating } from '@/services/ratingsService';

export default function RatingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserToRate, setSelectedUserToRate] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadPendingRatings();
  }, [isAuthenticated, router]);

  const loadPendingRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ratingsService.getPendingRatings();
      setPendingRatings(data.pendingRatings);
    } catch (error: any) {
      console.error('Error loading pending ratings:', error);
      setError(error.error || 'Failed to load pending ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleRateUser = (user: any, match: any) => {
    setSelectedUserToRate(user);
    setSelectedMatch(match);
  };

  const handleSubmitRating = async (rating: number, comment: string, isAnonymous: boolean) => {
    if (!selectedUserToRate || !selectedMatch) return;

    try {
      setIsSubmitting(true);
      
      await ratingsService.createRating({
        rated_user_id: selectedUserToRate.id,
        match_id: selectedMatch.id,
        rating,
        comment: comment || undefined,
        rating_type: selectedUserToRate.role,
        is_anonymous: isAnonymous
      });

      // Remove the rated user from the pending list
      setPendingRatings(prevRatings => 
        prevRatings.map(pending => {
          if (pending.match.id === selectedMatch.id) {
            return {
              ...pending,
              unratedUsers: pending.unratedUsers.filter(user => user.id !== selectedUserToRate.id)
            };
          }
          return pending;
        }).filter(pending => pending.unratedUsers.length > 0)
      );

      setSelectedUserToRate(null);
      setSelectedMatch(null);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPendingCount = () => {
    return pendingRatings.reduce((total, pending) => total + pending.unratedUsers.length, 0);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Rate Your Recent Matches</h1>
            <p className="text-gray-600">Help build trust in the community by rating your fellow players</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary */}
        {!loading && (
          <div className="mb-6">
            {getTotalPendingCount() > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">
                    You have {getTotalPendingCount()} pending rating{getTotalPendingCount() !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-700">
                    Help maintain trust in the community by rating your recent match participants
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">All caught up!</p>
                  <p className="text-sm text-green-700">
                    You've rated all participants from your recent matches
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingRatings.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Star className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending ratings
            </h3>
            <p className="text-gray-600 mb-6">
              You're all caught up! Check back after participating in more matches.
            </p>
            <Button onClick={() => router.push('/matches')}>
              Find Matches
            </Button>
          </div>
        ) : (
          /* Pending Ratings List */
          <div className="space-y-6">
            {pendingRatings.map((pending) => (
              <div key={pending.match.id} className="bg-white rounded-lg shadow">
                {/* Match Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pending.match.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(pending.match.scheduled_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {pending.unratedUsers.length} to rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users to Rate */}
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Rate the following participants:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pending.unratedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {user.profile_picture_url ? (
                              <img
                                src={user.profile_picture_url}
                                alt={user.first_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {user.role}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                              {user.avg_rating.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRateUser(user, pending.match)}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Rate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {selectedUserToRate && selectedMatch && (
          <RatingModal
            isOpen={true}
            onClose={() => {
              setSelectedUserToRate(null);
              setSelectedMatch(null);
            }}
            onSubmit={handleSubmitRating}
            userToRate={selectedUserToRate}
            matchTitle={selectedMatch.title}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
