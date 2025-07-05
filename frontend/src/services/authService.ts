import axios, { AxiosResponse } from 'axios';
import { User } from '@/store/authStore';

// API Base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sports-app-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Response interfaces
export interface AuthResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details?: string[];
}

// Authentication API calls
export const authService = {
  // User signup
  signup: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    bio?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // User login
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Get user profile
  getProfile: async (): Promise<{ message: string; data: { user: User } }> => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Update user profile
  updateProfile: async (updateData: Partial<User>): Promise<{ message: string; data: { user: User } }> => {
    try {
      const response = await api.put('/auth/profile', updateData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Change password
  changePassword: async (passwordData: {
    current_password: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string; database: string }> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  },
};

export default authService;
