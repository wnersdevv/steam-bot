'use strict';

const { EmbedBuilder } = require('discord.js');
const { TrackedGame, SteamAccount, Giveaway } = require('../database/models');

async function handleStats(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const [trackedCount, linkedInGuild, activeGiveaways, endedGiveaways] = await Promise.all([
    TrackedGame.countDocuments({ guildId: interaction.guildId }),
    // Not: SteamAccount guild'e bağlı değildir (kullanıcı globaldir); burada
    // sunucudaki üyelerden bağlı olanları saymak yerine takip/çekiliş gibi
    // guild-scoped gerçek verilere odaklanılır ve bu ayrım açıkça belirtilir.
    SteamAccount.countDocuments({}),
    Giveaway.countDocuments({ guildId: interaction.guildId, status: 'active' }),
    Giveaway.countDocuments({ guildId: interaction.guildId, status: 'ended' }),
  ]);

  const priceTracked = await TrackedGame.countDocuments({ guildId: interaction.guildId, trackPrice: true });
  const achievementTracked = await TrackedGame.countDocuments({ guildId: interaction.guildId, trackAchievements: true });

  const embed = new EmbedBuilder()
    .setTitle('📊 WNERSDEV İstatistikleri')
    .setColor(0x5865f2)
    .addFields(
      { name: 'Bu sunucuda takip edilen oyun', value: String(trackedCount), inline: true },
      { name: 'Fiyat takibi açık', value: String(priceTracked), inline: true },
      { name: 'Başarım takibi açık', value: String(achievementTracked), inline: true },
      { name: 'Aktif çekiliş', value: String(activeGiveaways), inline: true },
      { name: 'Tamamlanan çekiliş', value: String(endedGiveaways), inline: true },
      { name: 'Botta bağlı Steam hesabı (global)', value: String(linkedInGuild), inline: true }
    );

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleStats };
