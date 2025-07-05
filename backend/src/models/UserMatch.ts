import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface UserMatchAttributes {
  id: number;
  user_id: string;
  match_id: string;
  participation_status: 'pending' | 'confirmed' | 'declined';
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserMatchCreationAttributes {
  user_id: string;
  match_id: string;
  participation_status?: 'pending' | 'confirmed' | 'declined';
  joined_at?: Date;
}

class UserMatch extends Model<UserMatchAttributes, UserMatchCreationAttributes> 
  implements UserMatchAttributes {
  public id!: number;
  public user_id!: string;
  public match_id!: string;
  public participation_status!: 'pending' | 'confirmed' | 'declined';
  public joined_at!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

UserMatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    match_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'matches',
        key: 'id',
      },
    },
    participation_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'declined'),
      allowNull: false,
      defaultValue: 'pending',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
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
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'match_id'],
      },
    ],
  }
);

export default UserMatch;
