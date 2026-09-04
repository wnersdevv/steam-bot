'use strict';

const { TrackedGame, SteamAccount } = require('../database/models');
const { getPlayerAchievements } = require('../services/steamApiService');
const { getGuildSettings } = require('../services/guildSettingsService');
const { sendChannelPanel, sendDm } = require('../services/notificationService');
const logger = require('../utils/logger');

async function runAchievementCheck(client) {
  const trackedGames = await TrackedGame.find({ trackAchievements: true });
  logger.info(`Başarım kontrolü başlıyor (${trackedGames.length} takip)`);

  for (const tracked of trackedGames) {
    try {
      const account = await SteamAccount.findOne({ discordUserId: tracked.discordUserId }).lean();
      if (!account) continue; // hesabı çözülmüş/bağlantısı kaldırılmış olabilir

      const result = await getPlayerAchievements(account.steamId64, tracked.appId);
      if (!result.ok) continue; // profil gizli / oyunda başarım yok — sessizce atla

      const unlocked = result.achievements.filter((a) => a.achieved === 1).length;
      const previous = tracked.lastAchievementCount;

      if (previous !== undefined && previous !== null && unlocked > previous) {
        const gained = unlocked - previous;
        const settings = await getGuildSettings(tracked.guildId);
        const desc = `<@${tracked.discordUserId}>, **${tracked.name}** oyununda ${gained} yeni başarım açtı! (Toplam: ${unlocked}/${result.achievements.length})`;

        await sendDm(client, tracked.discordUserId, { title: '🏆 Yeni başarım!', description: desc });
        if (settings.logChannelId) {
          await sendChannelPanel(client, settings.logChannelId, { accentColor: 0xeb459e, title: '🏆 Başarım Açıldı', description: desc });
        }
      }

      tracked.lastAchievementCount = unlocked;
      await tracked.save();
    } catch (err) {
      logger.error('Başarım kontrolü sırasında hata', err, { appId: tracked.appId, discordUserId: tracked.discordUserId });
    }
  }
}

module.exports = { runAchievementCheck };
