'use strict';

const { requireAdmin } = require('../utils/permissions');
const { TrackedGame, SteamAccount } = require('../database/models');
const { getPrice, getPlayerAchievements, getPlayerSummary } = require('../services/steamApiService');
const { addAuditLog } = require('../services/auditService');

async function handleSync(interaction) {
  if (!(await requireAdmin(interaction))) return;
  await interaction.deferReply({ ephemeral: true });

  const trackedGames = await TrackedGame.find({ guildId: interaction.guildId });
  let priceUpdated = 0;
  let achievementUpdated = 0;
  let failed = 0;

  for (const t of trackedGames) {
    try {
      if (t.trackPrice) {
        const priceResult = await getPrice(t.appId);
        if (priceResult.ok && !priceResult.free) {
          t.lastKnownPriceCents = priceResult.price.final;
          t.lastKnownCurrency = priceResult.price.currency;
          priceUpdated++;
        }
      }
      if (t.trackAchievements) {
        const account = await SteamAccount.findOne({ discordUserId: t.discordUserId }).lean();
        if (account) {
          const achResult = await getPlayerAchievements(account.steamId64, t.appId);
          if (achResult.ok) {
            t.lastAchievementCount = achResult.achievements.filter((a) => a.achieved === 1).length;
            achievementUpdated++;
          }
        }
      }
      await t.save();
    } catch {
      failed++;
    }
  }

  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'senkronizasyon_calistirildi', metadata: { checked: trackedGames.length, priceUpdated, achievementUpdated, failed } });

  await interaction.editReply({
    content:
      `🔁 **Senkronizasyon tamamlandı**\n` +
      `Kontrol edilen takip: ${trackedGames.length}\n` +
      `Fiyat güncellenen: ${priceUpdated}\n` +
      `Başarım güncellenen: ${achievementUpdated}\n` +
      `Başarısız: ${failed}`,
  });
}

module.exports = { handleSync };
