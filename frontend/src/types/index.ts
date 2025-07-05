// Sport types
export interface Sport {
  id: string;
  name: string;
  description?: string;
  min_players: number;
  max_players: number;
}

// Match types
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface MatchOrganizer {
  id: string;
  first_name: string;
  last_name: string;
  avg_rating: number;
  total_ratings: number;
  phone?: string;
}

export interface Match {
  id: string;
  organizer_id: string;
  sport_id: string;
  title: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  scheduled_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time?: string; // HH:MM format
  max_players: number;
  current_players: number;
  required_skill_level: SkillLevel;
  cost: number;
  status: MatchStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  organizer?: MatchOrganizer;
  sport?: Sport;
}

// API Response types
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form types
export interface MatchFormData {
  sport_id: string;
  title: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  max_players: number;
  required_skill_level: SkillLevel;
  cost: number;
  is_public: boolean;
}

export interface MatchFilters {
  sport_id?: string;
  skill_level?: SkillLevel;
  date?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status?: MatchStatus;
}
