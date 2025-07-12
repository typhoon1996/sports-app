import User from './User';
import Match from './Match';
import UserMatch from './UserMatch';
import Sport from './Sport';
import Rating from './Rating';
import Notification from './Notification';
import Friendship from './Friendship';
import Report from './Report';

// Define associations between models
export const defineAssociations = () => {
  // User - Match associations
  User.hasMany(Match, {
    foreignKey: 'organizer_id',
    as: 'organizedMatches',
    onDelete: 'CASCADE'
  });

  Match.belongsTo(User, {
    foreignKey: 'organizer_id',
    as: 'organizer',
    onDelete: 'CASCADE'
  });

  // Sport - Match associations
  Sport.hasMany(Match, {
    foreignKey: 'sport_id',
    as: 'matches',
    onDelete: 'CASCADE'
  });

  Match.belongsTo(Sport, {
    foreignKey: 'sport_id',
    as: 'sport'
  });

  // Many-to-many User-Match association through user_matches table
  // for match participation
  User.belongsToMany(Match, {
    through: UserMatch,
    foreignKey: 'user_id',
    otherKey: 'match_id',
    as: 'participatingMatches'
  });

  Match.belongsToMany(User, {
    through: UserMatch,
    foreignKey: 'match_id',
    otherKey: 'user_id',
    as: 'participants'
  });

  // Direct associations for easier access
  User.hasMany(UserMatch, {
    foreignKey: 'user_id',
    as: 'userMatches',
    onDelete: 'CASCADE'
  });

  Match.hasMany(UserMatch, {
    foreignKey: 'match_id',
    as: 'userMatches',
    onDelete: 'CASCADE'
  });

  UserMatch.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  UserMatch.belongsTo(Match, {
    foreignKey: 'match_id',
    as: 'match'
  });

  // Rating associations
  User.hasMany(Rating, {
    foreignKey: 'rater_id',
    as: 'ratingsGiven',
    onDelete: 'CASCADE'
  });

  User.hasMany(Rating, {
    foreignKey: 'rated_user_id',
    as: 'ratingsReceived',
    onDelete: 'CASCADE'
  });

  Rating.belongsTo(User, {
    foreignKey: 'rater_id',
    as: 'rater'
  });

  Rating.belongsTo(User, {
    foreignKey: 'rated_user_id',
    as: 'ratedUser'
  });

  Match.hasMany(Rating, {
    foreignKey: 'match_id',
    as: 'ratings',
    onDelete: 'CASCADE'
  });

  Rating.belongsTo(Match, {
    foreignKey: 'match_id',
    as: 'match'
  });

  // User - Notification associations
  User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications',
    onDelete: 'CASCADE',
  });

  Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // User - Friendship associations
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

  // User - Report associations
  User.hasMany(Report, {
    foreignKey: 'reporter_id',
    as: 'reportsFiled',
    onDelete: 'CASCADE',
  });
  Report.belongsTo(User, {
    foreignKey: 'reporter_id',
    as: 'reporter',
  });
  console.log('✅ Model associations defined successfully');
};

export { User, Sport, Match, UserMatch, Rating, Notification, Friendship, Report };
