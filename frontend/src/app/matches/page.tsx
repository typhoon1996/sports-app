'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, MapPin, Calendar, Users, Clock, Plus, Star } from 'lucide-react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { sportsService, matchesService } from '@/services/sportsService';
import { Sport, Match, MatchFilters, SkillLevel } from '@/types';

const skillLevelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

const skillLevelColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

export default function MatchesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<MatchFilters>({
    status: 'upcoming'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Load sports for filter dropdown
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (error) {
        console.error('Error loading sports:', error);
      }
    };
    loadSports();
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          setFilters(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10 // Default 10km radius
          }));
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without location
        }
      );
    }
  }, []);

  // Load matches
  const loadMatches = async (page = 1) => {
    try {
      setLoading(true);
      const result = await matchesService.getMatches(filters, page, 12);
      setMatches(result.matches);
      setCurrentPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (error: any) {
      setError(error.error || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Load matches when filters change
  useEffect(() => {
    loadMatches(1);
  }, [filters]);

  const handleFilterChange = (key: keyof MatchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'upcoming',
      ...(userLocation && {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 10
      })
    });
    setSearchQuery('');
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

  const getAvailableSpots = (match: Match) => {
    return match.max_players - match.current_players;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view matches.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discover Matches</h1>
              <p className="text-gray-600">Find sports matches in your area</p>
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
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search matches by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sport Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                  <select
                    value={filters.sport_id || ''}
                    onChange={(e) => handleFilterChange('sport_id', e.target.value || undefined)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Sports</option>
                    {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>{sport.name}</option>
                    ))}
                  </select>
                </div>

                {/* Skill Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                  <select
                    value={filters.skill_level || ''}
                    onChange={(e) => handleFilterChange('skill_level', e.target.value || undefined)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={filters.date || ''}
                    onChange={(e) => handleFilterChange('date', e.target.value || undefined)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                {/* Radius Filter */}
                {userLocation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Radius ({filters.radius || 10}km)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={filters.radius || 10}
                      onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${total} matches found`}
          </p>
          {userLocation && (
            <p className="text-sm text-gray-500">
              <MapPin className="h-4 w-4 inline mr-1" />
              Showing matches near your location
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Matches Grid */}
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
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or create a new match.
            </p>
            <Link href="/matches/create">
              <Button>Create a Match</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full cursor-pointer">
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{match.title}</h3>
                      <p className="text-sm text-gray-600">{match.sport?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${skillLevelColors[match.required_skill_level]}`}>
                      {skillLevelLabels[match.required_skill_level]}
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
                      {match.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {match.current_players}/{match.max_players} players
                    </div>
                  </div>

                  {/* Organizer */}
                  {match.organizer && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        Organized by {match.organizer.first_name} {match.organizer.last_name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                        {match.organizer.avg_rating.toFixed(1)}
                      </div>
                    </div>
                  )}

                  {/* Cost and Available Spots */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {match.cost > 0 ? `₹${match.cost}` : 'Free'}
                    </div>
                    <div className={`text-sm font-medium ${
                      getAvailableSpots(match) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getAvailableSpots(match) > 0 
                        ? `${getAvailableSpots(match)} spots left` 
                        : 'Full'
                      }
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => loadMatches(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, currentPage - 2) + i;
                if (page > totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "primary" : "outline"}
                    onClick={() => loadMatches(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => loadMatches(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
