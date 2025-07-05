import { Model, DataTypes, BelongsToGetAssociationMixin, BelongsToSetAssociationMixin } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Match } from './Match';

export interface UserMatchAttributes {
  id?: number;
  userId: number;
  matchId: number;
  status: 'pending' | 'confirmed' | 'declined';
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserMatchCreationAttributes extends Omit<UserMatchAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserMatch extends Model<UserMatchAttributes, UserMatchCreationAttributes> implements UserMatchAttributes {
  public id!: number;
  public userId!: number;
  public matchId!: number;
  public status!: 'pending' | 'confirmed' | 'declined';
  public joinedAt!: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public getUser!: BelongsToGetAssociationMixin<User>;
  public setUser!: BelongsToSetAssociationMixin<User, number>;
  public getMatch!: BelongsToGetAssociationMixin<Match>;
  public setMatch!: BelongsToSetAssociationMixin<Match, number>;

  // Virtual fields
  public readonly user?: User;
  public readonly match?: Match;

  static associate() {
    UserMatch.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });
    UserMatch.belongsTo(Match, { 
      foreignKey: 'matchId', 
      as: 'match' 
    });
  }
}

UserMatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    matchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'matches',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'declined'),
      allowNull: false,
      defaultValue: 'pending',
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserMatch',
    tableName: 'user_matches',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'matchId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['matchId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);
