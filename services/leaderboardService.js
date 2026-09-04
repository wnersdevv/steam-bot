'use strict';

const { TrackedGame, Giveaway } = require('../database/models');

/**
 * Takip edilen oyunlardaki toplam bilinen başarım sayısına göre sıralar.
 * "lastAchievementCount" alanı scheduler tarafından gerçek Steam API
 * verisiyle güncellenir — burada hiçbir sayı uydurulmaz.
 */
async function getAchievementLeaderboard(guildId, limit = 10) {
  const rows = await TrackedGame.aggregate([
    { $match: { guildId, lastAchievementCount: { $ne: null } } },
    { $group: { _id: '$discordUserId', totalAchievements: { $sum: '$lastAchievementCount' }, gameCount: { $sum: 1 } } },
    { $sort: { totalAchievements: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ discordUserId: r._id, totalAchievements: r.totalAchievements, gameCount: r.gameCount }));
}

/** En çok oyun takip eden kullanıcılar */
async function getMostTrackedGamesLeaderboard(guildId, limit = 10) {
  const rows = await TrackedGame.aggregate([
    { $match: { guildId } },
    { $group: { _id: '$discordUserId', gameCount: { $sum: 1 } } },
    { $sort: { gameCount: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ discordUserId: r._id, gameCount: r.gameCount }));
}

/** En çok çekiliş kazanan kullanıcılar */
async function getGiveawayWinsLeaderboard(guildId, limit = 10) {
  const rows = await Giveaway.aggregate([
    { $match: { guildId, status: 'ended' } },
    { $unwind: '$winnerIds' },
    { $group: { _id: '$winnerIds', wins: { $sum: 1 } } },
    { $sort: { wins: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ discordUserId: r._id, wins: r.wins }));
}

module.exports = { getAchievementLeaderboard, getMostTrackedGamesLeaderboard, getGiveawayWinsLeaderboard };
