import Sport from '../models/Sport';

export const seedSports = async (): Promise<void> => {
  try {
    // Check if sports already exist
    const existingSports = await Sport.count();
    
    if (existingSports > 0) {
      console.log('🌱 Sports data already exists, skipping seed...');
      return;
    }

    console.log('🌱 Seeding sports data...');

    const sportsData = [
      {
        name: 'Football',
        description: 'Association football (soccer)',
        min_players: 10,
        max_players: 22
      },
      {
        name: 'Cricket',
        description: 'Cricket match',
        min_players: 10,
        max_players: 22
      },
      {
        name: 'Basketball',
        description: 'Basketball game',
        min_players: 6,
        max_players: 10
      },
      {
        name: 'Tennis',
        description: 'Tennis match',
        min_players: 2,
        max_players: 4
      },
      {
        name: 'Badminton',
        description: 'Badminton match',
        min_players: 2,
        max_players: 4
      },
      {
        name: 'Table Tennis',
        description: 'Table tennis match',
        min_players: 2,
        max_players: 4
      },
      {
        name: 'Volleyball',
        description: 'Volleyball match',
        min_players: 6,
        max_players: 12
      },
      {
        name: 'Swimming',
        description: 'Swimming session',
        min_players: 1,
        max_players: 20
      },
      {
        name: 'Running',
        description: 'Running group',
        min_players: 1,
        max_players: 50
      },
      {
        name: 'Cycling',
        description: 'Cycling group',
        min_players: 1,
        max_players: 30
      }
    ];

    await Sport.bulkCreate(sportsData);
    
    console.log('✅ Sports data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding sports data:', error);
    throw error;
  }
};
