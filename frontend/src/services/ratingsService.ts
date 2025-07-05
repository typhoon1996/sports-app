import axios, { AxiosResponse } from 'axios';

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

// Interfaces
export interface Rating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  match_id: string;
  rating: number;
  comment?: string;
  rating_type: 'organizer' | 'participant';
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  rater?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  ratedUser?: {
    id: string;
    first_name: string;
    last_name: string;
    avg_rating: number;
    total_ratings: number;
  };
  match?: {
    id: string;
    title: string;
    scheduled_date: string;
  };
}

export interface RatingStats {
  avgRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface PendingRating {
  match: {
    id: string;
    title: string;
    scheduled_date: string;
    sport_id: string;
  };
  unratedUsers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    avg_rating: number;
    role: 'organizer' | 'participant';
  }>;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

// Ratings API
export const ratingsService = {
  // Create a new rating
  createRating: async (ratingData: {
    rated_user_id: string;
    match_id: string;
    rating: number;
    comment?: string;
    rating_type?: 'organizer' | 'participant';
    is_anonymous?: boolean;
  }): Promise<Rating> => {
    try {
      const response: AxiosResponse<ApiResponse<{ rating: Rating }>> = 
        await api.post('/ratings', ratingData);
      return response.data.data.rating;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get ratings for a specific user
  getUserRatings: async (
    userId: string, 
    page = 1, 
    limit = 20, 
    ratingType?: 'organizer' | 'participant'
  ): Promise<{
    ratings: Rating[];
    stats: RatingStats;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (ratingType) params.append('rating_type', ratingType);

      const response: AxiosResponse<ApiResponse<{
        ratings: Rating[];
        stats: RatingStats;
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>> = await api.get(`/ratings/users/${userId}?${params.toString()}`);
      
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get ratings for a specific match
  getMatchRatings: async (matchId: string): Promise<{
    ratings: Rating[];
    count: number;
  }> => {
    try {
      const response: AxiosResponse<ApiResponse<{
        ratings: Rating[];
        count: number;
      }>> = await api.get(`/ratings/matches/${matchId}`);
      
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Update a rating
  updateRating: async (ratingId: string, updateData: {
    rating?: number;
    comment?: string;
    is_anonymous?: boolean;
  }): Promise<Rating> => {
    try {
      const response: AxiosResponse<ApiResponse<{ rating: Rating }>> = 
        await api.put(`/ratings/${ratingId}`, updateData);
      return response.data.data.rating;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Delete a rating
  deleteRating: async (ratingId: string): Promise<void> => {
    try {
      await api.delete(`/ratings/${ratingId}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get pending ratings for current user
  getPendingRatings: async (): Promise<{
    pendingRatings: PendingRating[];
    count: number;
  }> => {
    try {
      const response: AxiosResponse<ApiResponse<{
        pendingRatings: PendingRating[];
        count: number;
      }>> = await api.get('/ratings/pending/me');
      
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },
};

export default ratingsService;
