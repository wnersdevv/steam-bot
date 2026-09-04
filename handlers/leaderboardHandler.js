'use strict';

const { EmbedBuilder } = require('discord.js');
const { getAchievementLeaderboard, getMostTrackedGamesLeaderboard, getGiveawayWinsLeaderboard } = require('../services/leaderboardService');

const TITLES = {
  basarim: '🏆 Başarım Liderlik Tablosu',
  takip: '📋 En Çok Oyun Takip Edenler',
  cekilis: '🎉 En Çok Çekiliş Kazananlar',
};

async function handleLeaderboard(interaction) {
  const tur = interaction.options.getString('tur') || 'basarim';
  await interaction.deferReply({ ephemeral: true });

  let rows = [];
  let formatLine;

  if (tur === 'basarim') {
    rows = await getAchievementLeaderboard(interaction.guildId, 10);
    formatLine = (r, i) => `**${i + 1}.** <@${r.discordUserId}> — ${r.totalAchievements} başarım (${r.gameCount} oyun)`;
  } else if (tur === 'takip') {
    rows = await getMostTrackedGamesLeaderboard(interaction.guildId, 10);
    formatLine = (r, i) => `**${i + 1}.** <@${r.discordUserId}> — ${r.gameCount} oyun`;
  } else {
    rows = await getGiveawayWinsLeaderboard(interaction.guildId, 10);
    formatLine = (r, i) => `**${i + 1}.** <@${r.discordUserId}> — ${r.wins} kazanç`;
  }

  if (rows.length === 0) {
    return interaction.editReply({ content: 'Henüz bu kategori için yeterli veri yok.' });
  }

  const embed = new EmbedBuilder()
    .setTitle(TITLES[tur])
    .setColor(0xeb459e)
    .setDescription(rows.map(formatLine).join('\n'));

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleLeaderboard };
