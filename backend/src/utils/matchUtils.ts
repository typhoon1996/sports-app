import UserMatch from '../models/UserMatch';
import { Op } from 'sequelize';

/**
 * Fetches the IDs of confirmed participants for a given match.
 * @param matchId The ID of the match.
 * @param excludeUserId Optional user ID to exclude from the results.
 * @returns An array of participant user IDs.
 */
export const getMatchParticipants = async (
  matchId: string,
  excludeUserId?: string
): Promise<string[]> => {
  const whereClause: any = {
    match_id: matchId,
    participation_status: 'confirmed',
  };

  if (excludeUserId) {
    whereClause.user_id = { [Op.ne]: excludeUserId };
  }

  const participants = await UserMatch.findAll({
    where: whereClause,
    attributes: ['user_id'],
  });

  return participants.map((p) => p.user_id);
};