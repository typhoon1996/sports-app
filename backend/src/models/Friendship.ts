import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface FriendshipAttributes {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: Date;
  updated_at: Date;
}

interface FriendshipCreationAttributes extends Optional<FriendshipAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class Friendship extends Model<FriendshipAttributes, FriendshipCreationAttributes> implements FriendshipAttributes {
  public id!: string;
  public sender_id!: string;
  public receiver_id!: string;
  public status!: 'pending' | 'accepted' | 'rejected' | 'blocked';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Friendship.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // table name
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  receiver_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // table name
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
    allowNull: false,
    defaultValue: 'pending',
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
}, {
  sequelize,
  tableName: 'friendships',
  modelName: 'Friendship',
  timestamps: true,
  underscored: true,
});

// Define associations
User.hasMany(Friendship, {
  foreignKey: 'sender_id',
  as: 'sentFriendRequests',
  onDelete: 'CASCADE',
});

User.hasMany(Friendship, {
  foreignKey: 'receiver_id',
  as: 'receivedFriendRequests',
  onDelete: 'CASCADE',
});

Friendship.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
});

Friendship.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver',
});


export default Friendship;