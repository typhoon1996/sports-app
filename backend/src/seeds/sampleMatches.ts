import sequelize from '../config/database';
import User from '../models/User';
import Sport from '../models/Sport';
import Match from '../models/Match';
import UserMatch from '../models/UserMatch';

export async function seedMatches() {
  try {
    console.log('Seeding sample matches...');

    // Get existing users and sports
    const users = await User.findAll();
    const sports = await Sport.findAll();

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    if (sports.length === 0) {
      console.log('No sports found. Please seed sports first.');
      return;
    }

    // Create sample matches
    const sampleMatches = [
      {
        title: 'Weekend Soccer Match',
        description: 'Fun soccer game at the local park. All skill levels welcome!',
        sport_id: sports.find(s => s.name.toLowerCase().includes('soccer') || s.name.toLowerCase().includes('football'))?.id || sports[0].id,
        organizer_id: users[0].id,
        location: 'Central Park Soccer Field',
        latitude: 40.7829,
        longitude: -73.9654,
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        max_players: 20,
        skill_level: 'beginner',
        is_public: true,
        status: 'upcoming'
      },
      {
        title: 'Basketball Tournament',
        description: 'Competitive basketball tournament. Teams of 5 players each.',
        sport_id: sports.find(s => s.name.toLowerCase().includes('basketball'))?.id || sports[1]?.id || sports[0].id,
        organizer_id: users[1]?.id || users[0].id,
        location: 'Community Center Court',
        latitude: 40.7614,
        longitude: -73.9776,
        date_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        max_players: 10,
        skill_level: 'intermediate',
        is_public: true,
        status: 'upcoming'
      },
      {
        title: 'Morning Tennis Match',
        description: 'Early morning tennis doubles match. Looking for 2 more players.',
        sport_id: sports.find(s => s.name.toLowerCase().includes('tennis'))?.id || sports[2]?.id || sports[0].id,
        organizer_id: users[2]?.id || users[0].id,
        location: 'City Tennis Courts',
        latitude: 40.7505,
        longitude: -73.9934,
        date_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        max_players: 4,
        skill_level: 'advanced',
        is_public: true,
        status: 'upcoming'
      },
      {
        title: 'Casual Running Group',
        description: 'Weekly running group. 5K route through the neighborhood.',
        sport_id: sports.find(s => s.name.toLowerCase().includes('running') || s.name.toLowerCase().includes('track'))?.id || sports[3]?.id || sports[0].id,
        organizer_id: users[3]?.id || users[0].id,
        location: 'Brooklyn Bridge Park',
        latitude: 40.7023,
        longitude: -73.9964,
        date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        max_players: 15,
        skill_level: 'beginner',
        is_public: true,
        status: 'upcoming'
      },
      {
        title: 'Private Swimming Session',
        description: 'Private swimming training session for team members only.',
        sport_id: sports.find(s => s.name.toLowerCase().includes('swimming'))?.id || sports[4]?.id || sports[0].id,
        organizer_id: users[4]?.id || users[0].id,
        location: 'Olympic Pool Complex',
        latitude: 40.7589,
        longitude: -73.9851,
        date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        max_players: 8,
        skill_level: 'advanced',
        is_public: false,
        status: 'upcoming'
      },
      {
        title: 'Beach Volleyball Tournament',
        description: 'Sand volleyball tournament at the beach. Prizes for winners!',
        sport_id: sports.find(s => s.name.toLowerCase().includes('volleyball'))?.id || sports[5]?.id || sports[0].id,
        organizer_id: users[5]?.id || users[0].id,
        location: 'Coney Island Beach',
        latitude: 40.5755,
        longitude: -73.9707,
        date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        max_players: 12,
        skill_level: 'intermediate',
        is_public: true,
        status: 'upcoming'
      }
    ];

    // Create matches
    const createdMatches = await Match.bulkCreate(sampleMatches, {
      returning: true
    });

    console.log(`Created ${createdMatches.length} sample matches`);

    // Create sample participations
    const participations = [];
    
    for (let i = 0; i < createdMatches.length; i++) {
      const match = createdMatches[i];
      const maxParticipants = Math.min(match.max_players, users.length - 1); // Exclude organizer
      const numParticipants = Math.floor(Math.random() * maxParticipants) + 1; // At least 1 participant

      // Get random users (excluding the organizer)
      const availableUsers = users.filter(u => u.id !== match.organizer_id);
      const selectedUsers = availableUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, numParticipants);

      for (const user of selectedUsers) {
        participations.push({
          user_id: user.id,
          match_id: match.id,
          status: Math.random() > 0.2 ? 'confirmed' : 'pending', // 80% confirmed, 20% pending
          joined_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Joined within last week
        });
      }
    }

    if (participations.length > 0) {
      await UserMatch.bulkCreate(participations);
      console.log(`Created ${participations.length} sample participations`);
    }

    console.log('Sample matches and participations seeded successfully!');
    
    // Log some statistics
    const totalMatches = await Match.count();
    const totalParticipations = await UserMatch.count();
    console.log(`Total matches in database: ${totalMatches}`);
    console.log(`Total participations in database: ${totalParticipations}`);

  } catch (error) {
    console.error('Error seeding matches:', error);
    throw error;
  }
}

// Function to clear existing matches and participations
export async function clearMatches() {
  try {
    console.log('Clearing existing matches and participations...');
    
    await UserMatch.destroy({ where: {} });
    await Match.destroy({ where: {} });
    
    console.log('Matches and participations cleared successfully!');
  } catch (error) {
    console.error('Error clearing matches:', error);
    throw error;
  }
}

// Main function to run seeding
export async function runMatchSeeding() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Optionally clear existing data
    // await clearMatches();
    
    await seedMatches();
    
    console.log('Match seeding completed successfully!');
  } catch (error) {
    console.error('Match seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMatchSeeding();
}
