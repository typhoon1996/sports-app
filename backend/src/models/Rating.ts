import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Match from './Match';

// Rating attributes interface
export interface RatingAttributes {
  id: string;
  rater_id: string; // User who is giving the rating
  rated_user_id: string; // User being rated
  match_id: string; // Match context for the rating
  rating: number; // 1-5 stars
  comment?: string; // Optional review comment
  rating_type: 'organizer' | 'participant'; // Context of the rating
  is_anonymous: boolean; // Whether to show rater identity
  created_at: Date;
  updated_at: Date;
}

// Rating creation attributes
export interface RatingCreationAttributes extends Optional<RatingAttributes, 
  'id' | 'comment' | 'is_anonymous' | 'created_at' | 'updated_at'> {}

// Rating class extending Sequelize Model
class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  public id!: string;
  public rater_id!: string;
  public rated_user_id!: string;
  public match_id!: string;
  public rating!: number;
  public comment?: string;
  public rating_type!: 'organizer' | 'participant';
  public is_anonymous!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public rater?: User;
  public ratedUser?: User;
  public match?: Match;

  // Instance methods
  public toJSON(): any {
    const values = { ...this.get() } as any;
    return values;
  }

  // Static methods
  public static async getUserAverageRating(userId: string): Promise<{ avgRating: number; totalRatings: number }> {
    const result = await this.findAll({
      where: { rated_user_id: userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings']
      ],
      raw: true
    });

    const data = result[0] as any;
    return {
      avgRating: parseFloat(data.avgRating) || 0,
      totalRatings: parseInt(data.totalRatings) || 0
    };
  }

  public static async getMatchRatings(matchId: string): Promise<Rating[]> {
    return this.findAll({
      where: { match_id: matchId },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url']
        },
        {
          model: User,
          as: 'ratedUser',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  public static async hasUserRatedInMatch(raterId: string, ratedUserId: string, matchId: string): Promise<boolean> {
    const existing = await this.findOne({
      where: {
        rater_id: raterId,
        rated_user_id: ratedUserId,
        match_id: matchId
      }
    });
    return !!existing;
  }
}

// Define the Rating model
Rating.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  rater_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  rated_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  match_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'matches',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
      isInt: true
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000] // Max 1000 characters
    }
  },
  rating_type: {
    type: DataTypes.ENUM('organizer', 'participant'),
    allowNull: false,
    defaultValue: 'participant'
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  }
}, {
  sequelize,
  modelName: 'Rating',
  tableName: 'ratings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['rater_id'] },
    { fields: ['rated_user_id'] },
    { fields: ['match_id'] },
    { fields: ['rating'] },
    { fields: ['created_at'] },
    // Composite index to prevent duplicate ratings
    { 
      fields: ['rater_id', 'rated_user_id', 'match_id'],
      unique: true,
      name: 'unique_rating_per_match'
    }
  ],
  validate: {
    // Prevent self-rating
    preventSelfRating() {
      if (this.rater_id === this.rated_user_id) {
        throw new Error('Users cannot rate themselves');
      }
    }
  }
});

export default Rating;
