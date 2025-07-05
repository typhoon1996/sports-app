import axios, { AxiosResponse } from 'axios';
import { Sport, Match, MatchFormData, MatchFilters, ApiResponse, PaginatedResponse } from '@/types';

// API Base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('sports-app-auth');
      if (authData) {
        try {
          const { state } = JSON.parse(authData);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
        } catch (error) {
          console.error('Error parsing auth data from localStorage:', error);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sports-app-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Sports API
export const sportsService = {
  // Get all sports
  getAllSports: async (): Promise<Sport[]> => {
    try {
      const response: AxiosResponse<ApiResponse<{ sports: Sport[]; count: number }>> = 
        await api.get('/sports');
      return response.data.data.sports;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get sport by ID
  getSportById: async (id: string): Promise<Sport> => {
    try {
      const response: AxiosResponse<ApiResponse<{ sport: Sport }>> = 
        await api.get(`/sports/${id}`);
      return response.data.data.sport;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },
};

// Matches API
export const matchesService = {
  // Get matches with filters and pagination
  getMatches: async (filters?: MatchFilters, page = 1, limit = 20): Promise<{
    matches: Match[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.sport_id) params.append('sport_id', filters.sport_id);
      if (filters?.skill_level) params.append('skill_level', filters.skill_level);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.latitude) params.append('latitude', filters.latitude.toString());
      if (filters?.longitude) params.append('longitude', filters.longitude.toString());
      if (filters?.radius) params.append('radius', filters.radius.toString());
      if (filters?.status) params.append('status', filters.status);
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response: AxiosResponse<ApiResponse<{
        matches: Match[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>> = await api.get(`/matches?${params.toString()}`);
      
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get match by ID
  getMatchById: async (id: string): Promise<Match> => {
    try {
      const response: AxiosResponse<ApiResponse<{ match: Match }>> = 
        await api.get(`/matches/${id}`);
      return response.data.data.match;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Create new match
  createMatch: async (matchData: MatchFormData): Promise<Match> => {
    try {
      const response: AxiosResponse<ApiResponse<{ match: Match }>> = 
        await api.post('/matches', matchData);
      return response.data.data.match;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Update match
  updateMatch: async (id: string, matchData: Partial<MatchFormData>): Promise<Match> => {
    try {
      const response: AxiosResponse<ApiResponse<{ match: Match }>> = 
        await api.put(`/matches/${id}`, matchData);
      return response.data.data.match;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Delete match
  deleteMatch: async (id: string): Promise<void> => {
    try {
      await api.delete(`/matches/${id}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get match details with participants
  getMatchDetails: async (id: string): Promise<any> => {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await api.get(`/matches/${id}/details`);
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Join a match
  joinMatch: async (matchId: string): Promise<void> => {
    try {
      await api.post(`/matches/${matchId}/join`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Leave a match
  leaveMatch: async (matchId: string): Promise<void> => {
    try {
      await api.delete(`/matches/${matchId}/leave`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get user's organized matches
  getUserMatches: async (status?: string, page = 1, limit = 20): Promise<{
    matches: Match[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response: AxiosResponse<ApiResponse<{
        matches: Match[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>> = await api.get(`/matches/user/organized?${params.toString()}`);
      
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },
};

export default { sportsService, matchesService };
