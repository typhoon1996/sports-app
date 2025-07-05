import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Sport attributes interface
export interface SportAttributes {
  id: string;
  name: string;
  description?: string;
  min_players: number;
  max_players: number;
  created_at: Date;
  updated_at: Date;
}

// Sport creation attributes
export interface SportCreationAttributes extends Optional<SportAttributes, 
  'id' | 'description' | 'created_at' | 'updated_at'> {}

// Sport class extending Sequelize Model
class Sport extends Model<SportAttributes, SportCreationAttributes> implements SportAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public min_players!: number;
  public max_players!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Instance methods
  public toJSON(): SportAttributes {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      min_players: this.min_players,
      max_players: this.max_players,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

// Define the Sport model
Sport.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  min_players: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: 1,
      max: 50
    }
  },
  max_players: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 22,
    validate: {
      min: 2,
      max: 100
    }
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
  modelName: 'Sport',
  tableName: 'sports',
  timestamps: true,
  underscored: true,
  validate: {
    playersValidation() {
      if ((this as any).min_players > (this as any).max_players) {
        throw new Error('Minimum players cannot be greater than maximum players');
      }
    }
  }
});

export default Sport;
