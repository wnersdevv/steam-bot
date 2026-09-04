'use strict';

const { EmbedBuilder } = require('discord.js');
const { getLinkedAccount } = require('../services/steamAccountService');
const { getPlayerAchievements, getGameSchema, getGlobalAchievementPercentages } = require('../services/steamApiService');
const { failReasonMessage } = require('./accountHandler');

function achievementFailMessage(reason) {
  if (reason === 'no_stats_or_private') return '🔒 Bu oyun için başarım verisi alınamadı (profil/oyun istatistikleri gizli olabilir ya da oyunda başarım yok).';
  return failReasonMessage(reason);
}

async function handleAchievements(interaction) {
  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const appId = interaction.options.getInteger('appid', true);

  await interaction.deferReply({ ephemeral: true });

  const account = await getLinkedAccount(targetUser.id);
  if (!account) {
    const who = targetUser.id === interaction.user.id ? 'Steam hesabını bağlamadın.' : 'Bu kullanıcı Steam hesabını bağlamamış.';
    return interaction.editReply({ content: `❌ ${who}` });
  }

  const [achResult, schemaResult, globalResult] = await Promise.all([
    getPlayerAchievements(account.steamId64, appId),
    getGameSchema(appId),
    getGlobalAchievementPercentages(appId),
  ]);

  if (!achResult.ok) {
    return interaction.editReply({ content: achievementFailMessage(achResult.reason) });
  }

  const total = achResult.achievements.length;
  const unlocked = achResult.achievements.filter((a) => a.achieved === 1).length;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const schemaMap = new Map();
  if (schemaResult.ok) {
    for (const a of schemaResult.schema.availableGameStats?.achievements || []) {
      schemaMap.set(a.name, a.displayName);
    }
  }

  const globalMap = new Map();
  if (globalResult.ok) {
    for (const a of globalResult.achievements) globalMap.set(a.name, a.percent);
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${achResult.gameName || 'Başarımlar'}`)
    .setColor(0xeb459e)
    .setDescription(`**${account.personaName}** — ${unlocked}/${total} açıldı (%${percent})`);

  const sample = achResult.achievements.slice(0, 15);
  const lines = sample.map((a) => {
    const name = schemaMap.get(a.apiname) || a.apiname;
    const globalPct = globalMap.has(a.apiname) ? ` (dünya genelinde %${Number(globalMap.get(a.apiname)).toFixed(1)})` : '';
    return `${a.achieved === 1 ? '✅' : '⬜'} ${name}${globalPct}`;
  });
  embed.addFields({ name: `Başarımlar (ilk ${sample.length}/${total})`, value: lines.join('\n').slice(0, 1024) || 'Veri yok' });

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleAchievements };
