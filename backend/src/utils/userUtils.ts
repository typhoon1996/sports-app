import User from '../models/User';

export const getUserById = async (userId: string) => {
  try {
    const user = await User.findByPk(userId);
    return user;
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error);
    throw error;
  }
};