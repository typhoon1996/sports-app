import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface ReportAttributes {
  id: string;
  reporter_id: string;
  reported_item_type: 'match' | 'message' | 'user';
  reported_item_id: string; // Storing as string for simplicity
  reason: string;
  status: 'pending' | 'under_review' | 'resolved';
  created_at: Date;
  updated_at: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: string;
  public reporter_id!: string;
  public reported_item_type!: 'match' | 'message' | 'user';
  public reported_item_id!: string;
  public reason!: string;
  public status!: 'pending' | 'under_review' | 'resolved';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Report.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  reporter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // table name
      key: 'id',
    },
    onDelete: 'SET NULL', // Or CASCADE depending on desired behavior
  },
  reported_item_type: {
    type: DataTypes.ENUM('match', 'message', 'user'),
    allowNull: false,
  },
  reported_item_id: {
    type: DataTypes.STRING, // Store as string
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'resolved'),
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
  tableName: 'reports',
  modelName: 'Report',
  timestamps: true,
  underscored: true,
});

// Define association
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reportedItems' });


export default Report;