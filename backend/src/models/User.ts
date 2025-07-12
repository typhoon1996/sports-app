import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

// User attributes interface
export interface UserAttributes {
  id: string;
  email: string;
  password_hash?: string; // Optional for OAuth users
  first_name: string;
  last_name: string;
  phone?: string;
  profile_picture_url?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  avg_rating: number;
  total_ratings: number;
  is_verified: boolean;
  is_active: boolean;
  // OAuth fields
  google_id?: string;
  is_blocked_by_admin: boolean;
  is_admin: boolean;
 notification_preferences?: object | any;
  facebook_id?: string;
  provider?: 'local' | 'google' | 'facebook';
  provider_id?: string;
  created_at: Date;
  updated_at: Date;
}

// User creation attributes (optional fields for creation)
export interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'phone' | 'profile_picture_url' | 'bio' | 'location' | 'latitude' | 'longitude' | 
  'avg_rating' | 'total_ratings' | 'is_verified' | 'is_active' | 'password_hash' | 
  'google_id' | 'facebook_id' | 'provider' | 'provider_id' | 'created_at' | 'updated_at'> {}

// User class extending Sequelize Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public phone?: string;
  public profile_picture_url?: string;
  public bio?: string;
  public location?: string;
  public latitude?: number;
  public longitude?: number;
  public avg_rating!: number;
  public total_ratings!: number;
  public is_verified!: boolean;
  public is_active!: boolean;
  public google_id?: string;
  public is_admin!: boolean;
  public is_blocked_by_admin!: boolean;
  public notification_preferences?: object | any;
  public facebook_id?: string;
  public provider?: 'local' | 'google' | 'facebook';
  public provider_id?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as any;
    delete values.password_hash; // Never return password hash
    return values;
  }

  public getFullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  // Static methods
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ 
      where: { email: email.toLowerCase() },
      attributes: { include: ['password_hash'] } // Include password for authentication
    });
  }
}

// Define the User model
User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [5, 255]
    },
    set(value: string) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    },
    set(value: string) {
      this.setDataValue('first_name', value.trim());
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    },
    set(value: string) {
      this.setDataValue('last_name', value.trim());
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  profile_picture_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  avg_rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_ratings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_blocked_by_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notification_preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
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
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password_hash) {
        user.password_hash = await User.hashPassword(user.password_hash);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password_hash')) {
        user.password_hash = await User.hashPassword(user.password_hash);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password_hash'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password_hash'] }
    }
  }
});

export default User;
