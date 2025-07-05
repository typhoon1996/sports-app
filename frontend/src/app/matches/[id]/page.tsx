'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  DollarSign,
  MessageCircle,
  UserPlus,
  UserMinus,
  Phone,
  Share2,
  Flag,
  Edit
} from 'lucide-react';

import Button from '@/components/Button';
import MatchChat from '@/components/MatchChat';
import { useAuthStore } from '@/store/authStore';
import { matchesService } from '@/services/sportsService';
import { Match, User } from '@/types';

interface MatchDetails extends Match {
  participants: User[];
  organizer: User;
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const matchId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadMatchDetails();
  }, [matchId, isAuthenticated, router]);

  const loadMatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const matchData = await matchesService.getMatchDetails(matchId);
      setMatch(matchData);
    } catch (error: any) {
      console.error('Error loading match details:', error);
      setError(error.error || 'Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!match || !user) return;

    try {
      setJoining(true);
      await matchesService.joinMatch(matchId);
      
      // Update local state
      setMatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          current_players: prev.current_players + 1,
          participants: [...prev.participants, user]
        };
      });
    } catch (error: any) {
      console.error('Error joining match:', error);
      setError(error.error || 'Failed to join match');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!match || !user) return;

    try {
      setLeaving(true);
      await matchesService.leaveMatch(matchId);
      
      // Update local state
      setMatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          current_players: prev.current_players - 1,
          participants: prev.participants.filter(p => p.id !== user.id)
        };
      });
    } catch (error: any) {
      console.error('Error leaving match:', error);
      setError(error.error || 'Failed to leave match');
    } finally {
      setLeaving(false);
    }
  };

  const handleShareMatch = async () => {
    if (!match) return;

    try {
      await navigator.share({
        title: match.title,
        text: `Join me for ${match.sport?.name} on ${formatDate(match.scheduled_date)} at ${formatTime(match.start_time)}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Match link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return level;
    }
  };

  const isUserParticipant = () => {
    return match?.participants.some(p => p.id === user?.id) || false;
  };

  const isUserOrganizer = () => {
    return match?.organizer.id === user?.id;
  };

  const isMatchFull = () => {
    return match ? match.current_players >= match.max_players : false;
  };

  const getAvailableSpots = () => {
    return match ? match.max_players - match.current_players : 0;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Match not found'}
          </h1>
          <Link href="/matches">
            <Button>Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/matches">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{match.title}</h1>
                <p className="text-gray-600">{match.sport?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleShareMatch}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isUserOrganizer() && (
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillLevelColor(match.required_skill_level)}`}>
                  {getSkillLevelLabel(match.required_skill_level)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {match.cost > 0 ? `₹${match.cost}` : 'Free'}
                  </div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3" />
                    <span>{formatDate(match.scheduled_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3" />
                    <span>
                      {formatTime(match.start_time)}
                      {match.end_time && ` - ${formatTime(match.end_time)}`}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-3" />
                    <span>{match.current_players}/{match.max_players} players</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5" />
                    <span>{match.location}</span>
                  </div>
                </div>
              </div>

              {match.description && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{match.description}</p>
                </div>
              )}
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organized by</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {match.organizer.profile_picture_url ? (
                      <img 
                        src={match.organizer.profile_picture_url} 
                        alt={match.organizer.first_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {match.organizer.first_name[0]}{match.organizer.last_name[0]}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">
                      {match.organizer.first_name} {match.organizer.last_name}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                      {match.organizer.avg_rating.toFixed(1)} ({match.organizer.total_ratings} reviews)
                    </div>
                  </div>
                </div>
                {!isUserOrganizer() && match.organizer.phone && (
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                )}
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Participants ({match.current_players}/{match.max_players})
              </h3>
              {match.participants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {match.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {participant.profile_picture_url ? (
                          <img 
                            src={participant.profile_picture_url} 
                            alt={participant.first_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {participant.first_name[0]}{participant.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.first_name} {participant.last_name}
                          {participant.id === match.organizer.id && (
                            <span className="ml-2 text-xs text-blue-600">(Organizer)</span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                          {participant.avg_rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No participants yet. Be the first to join!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {!isUserOrganizer() && (
                  <>
                    {isUserParticipant() ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLeaveMatch}
                        isLoading={leaving}
                        disabled={leaving}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {leaving ? 'Leaving...' : 'Leave Match'}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={handleJoinMatch}
                        isLoading={joining}
                        disabled={joining || isMatchFull()}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {joining ? 'Joining...' : isMatchFull() ? 'Match Full' : 'Join Match'}
                      </Button>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </Button>

                {!isUserOrganizer() && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                )}
              </div>

              {/* Match Status */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getAvailableSpots() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getAvailableSpots()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getAvailableSpots() === 1 ? 'spot left' : 'spots left'}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Component */}
            {showChat && (
              <div className="bg-white rounded-lg shadow">
                <MatchChat matchId={matchId} inline={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
