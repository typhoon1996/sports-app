import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User'; // Import the User model

// Notification attributes interface
export interface NotificationAttributes {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Notification creation attributes (optional fields for creation)
export interface NotificationCreationAttributes extends Optional<NotificationAttributes,
  'id' | 'is_read' | 'created_at' | 'updated_at'> {}

// Notification class extending Sequelize Model
class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public user_id!: string;
  public type!: string;
  public message!: string;
  public is_read!: boolean;
  public is_dismissed!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Define associations
  public readonly user?: User; // Optional: to access the user associated with the notification
}

// Define the Notification model
Notification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // name of the target table
      key: 'id', // key in the target table that we're referencing
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_dismissed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
});

// Define the association
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user' // Optional: alias for the association
});

User.hasMany(Notification, {
  foreignKey: 'id',
  as: 'notifications' // Optional: alias for the association
});

export default Notification;