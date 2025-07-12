import { DataTypes, Model, Optional, QueryTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Sport from './Sport';

// Enum types
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// Match attributes interface
export interface MatchAttributes {
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
  created_at: Date;
  updated_at: Date;
  search_vector?: any; // For full-text search
}

// Match creation attributes
export interface MatchCreationAttributes extends Optional<MatchAttributes, 
  'id' | 'description' | 'end_time' | 'current_players' | 'required_skill_level' | 
  'cost' | 'status' | 'is_public' | 'created_at' | 'updated_at'> {}

// Match class extending Sequelize Model
class Match extends Model<MatchAttributes, MatchCreationAttributes> implements MatchAttributes {
  public id!: string;
  public organizer_id!: string;
  public sport_id!: string;
  public title!: string;
  public description?: string;
  public location!: string;
  public latitude!: number;
  public longitude!: number;
  public scheduled_date!: string;
  public start_time!: string;
  public end_time?: string;
  public max_players!: number;
  public current_players!: number;
  public required_skill_level!: SkillLevel;
  public cost!: number;
  public status!: MatchStatus;
  public is_public!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public organizer?: User;
  public sport?: Sport;

  // Instance methods
  public toJSON(): any {
    const values = { ...this.get() } as any;
    return values;
  }

  public isUpcoming(): boolean {
    return this.status === 'upcoming';
  }

  public isJoinable(): boolean {
    return this.status === 'upcoming' && this.current_players < this.max_players;
  }

  public isFull(): boolean {
    return this.current_players >= this.max_players;
  }

  public getDateTime(): Date {
    return new Date(`${this.scheduled_date}T${this.start_time}`);
  }

  public static async findNearby(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<Match[]> {
    // Using Haversine formula for distance calculation
    const query = `
      SELECT *, 
        (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) * 
        sin(radians(latitude)))) AS distance 
      FROM matches 
      WHERE status = 'upcoming' 
      HAVING distance <= :radius 
      ORDER BY distance
    `;

    const matches = await sequelize.query(query, {
      replacements: { lat: latitude, lng: longitude, radius: radiusKm },
      type: QueryTypes.SELECT,
      model: Match,
      mapToModel: true
    });

    return matches as Match[];
  }
}

// Define the Match model
Match.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  organizer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sport_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sports',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [3, 200],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  scheduled_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString().split('T')[0] // Must be today or future
    }
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  max_players: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2,
      max: 100
    }
  },
  current_players: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Organizer is automatically included
    validate: {
      min: 1
    }
  },
  required_skill_level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false,
    defaultValue: 'beginner'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 10000
    }
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'upcoming'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  search_vector: {
    type: 'TSVECTOR' as any,
    allowNull: true,
    comment: 'Generated column for full-text search',
    dialectOptions: {
      collate: 'pg_catalog.english' // Use English dictionary for stemming
    }
  }
}, {
  sequelize,
  modelName: 'Match',
  tableName: 'matches',
  timestamps: true,
  underscored: true,
  validate: {
    playerCountValidation() {
      if ((this as any).current_players > (this as any).max_players) {
        throw new Error('Current players cannot exceed maximum players');
      }
    },
    timeValidation() {
      if ((this as any).end_time && (this as any).start_time >= (this as any).end_time) {
        throw new Error('End time must be after start time');
      }
    }
  },
  indexes: [
    { fields: ['organizer_id'] },
    { fields: ['sport_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_date'] },
    { fields: ['latitude', 'longitude'] },
    { fields: ['created_at'] }
  ]
});

export default Match;
