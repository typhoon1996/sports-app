'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Plus,
  Filter,
  ChevronRight
} from 'lucide-react';

import Button from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { matchesService } from '@/services/sportsService';
import { Match } from '@/types';

type TabType = 'organized' | 'participating';
type StatusFilter = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export default function MyMatchesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('organized');
  const [organizedMatches, setOrganizedMatches] = useState<Match[]>([]);
  const [participatingMatches, setParticipatingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadMatches();
  }, [isAuthenticated, router, statusFilter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = statusFilter === 'all' ? undefined : statusFilter;
      
      // Load organized matches
      const organizedData = await matchesService.getUserMatches(status);
      setOrganizedMatches(organizedData.matches);
      
      // Note: Add participating matches API when available
      setParticipatingMatches([]);
      
    } catch (error: any) {
      console.error('Error loading matches:', error);
      setError(error.error || 'Failed to load matches');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const currentMatches = activeTab === 'organized' ? organizedMatches : participatingMatches;
  const filteredMatches = statusFilter === 'all' 
    ? currentMatches 
    : currentMatches.filter(match => match.status === statusFilter);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
              <p className="text-gray-600">Manage your organized and participating matches</p>
            </div>
            <Link href="/matches/create">
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create Match
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('organized')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'organized'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Organized ({organizedMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('participating')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'participating'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Participating ({participatingMatches.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'organized' ? 'No organized matches' : 'No participating matches'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'organized' 
                ? 'You haven\'t organized any matches yet. Create your first match to get started!'
                : 'You\'re not participating in any matches yet. Browse available matches to join.'
              }
            </p>
            <div className="flex justify-center space-x-4">
              {activeTab === 'organized' ? (
                <Link href="/matches/create">
                  <Button>Create Your First Match</Button>
                </Link>
              ) : (
                <Link href="/matches">
                  <Button>Browse Matches</Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Matches Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full cursor-pointer">
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{match.title}</h3>
                      <p className="text-sm text-gray-600">{match.sport?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                      {getStatusLabel(match.status)}
                    </span>
                  </div>

                  {/* Match Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(match.scheduled_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatTime(match.start_time)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{match.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {match.current_players}/{match.max_players} players
                    </div>
                  </div>

                  {/* Organizer (for participating matches) */}
                  {activeTab === 'participating' && match.organizer && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          Organized by {match.organizer.first_name} {match.organizer.last_name}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                          {match.organizer.avg_rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cost and Action */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {match.cost > 0 ? `₹${match.cost}` : 'Free'}
                    </div>
                    <div className="flex items-center text-sm text-blue-600">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
