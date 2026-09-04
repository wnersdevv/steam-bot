'use strict';

const { EmbedBuilder } = require('discord.js');
const { trackGame, untrackGame, listTrackedGames } = require('../services/trackingService');
const { failReasonMessage } = require('./accountHandler');
const { checkRateLimit } = require('../utils/rateLimit');

async function handleTrackAdd(interaction) {
  const rl = checkRateLimit(`takip-ekle:${interaction.user.id}`, 10, 60000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlı işlem yapıyorsun, biraz bekle.', ephemeral: true });

  const appId = interaction.options.getInteger('appid', true);
  const trackPrice = interaction.options.getBoolean('fiyat') ?? true;
  const trackAchievements = interaction.options.getBoolean('basarim') ?? false;
  const targetPrice = interaction.options.getNumber('hedef-fiyat') ?? undefined;

  await interaction.deferReply({ ephemeral: true });

  const result = await trackGame({
    discordUserId: interaction.user.id,
    guildId: interaction.guildId,
    appId,
    trackPrice,
    trackAchievements,
    targetPrice,
  });

  if (!result.ok) {
    return interaction.editReply({ content: result.reason === 'not_found' ? `❌ appid ${appId} bulunamadı.` : failReasonMessage(result.reason) });
  }

  await interaction.editReply({
    content: `✅ **${result.tracked.name}** takip listene eklendi.\n${trackPrice ? '💰 Fiyat takibi açık' : ''}${trackAchievements ? '\n🏆 Başarım takibi açık' : ''}${targetPrice ? `\n🎯 Hedef fiyat: ${targetPrice}` : ''}`,
  });
}

async function handleTrackRemove(interaction) {
  const appId = interaction.options.getInteger('appid', true);
  await interaction.deferReply({ ephemeral: true });
  const result = await untrackGame(interaction.user.id, appId);
  if (!result.ok) return interaction.editReply({ content: '❌ Bu oyunu takip etmiyorsun.' });
  await interaction.editReply({ content: '✅ Takipten çıkarıldı.' });
}

async function handleTrackList(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const tracked = await listTrackedGames(interaction.user.id);

  if (tracked.length === 0) {
    return interaction.editReply({ content: 'Henüz hiçbir oyun takip etmiyorsun. `/steam takip ekle` ile başlayabilirsin.' });
  }

  const embed = new EmbedBuilder().setTitle('📋 Takip Ettiğin Oyunlar').setColor(0x5865f2);
  for (const t of tracked.slice(0, 25)) {
    const flags = [t.trackPrice ? '💰' : null, t.trackAchievements ? '🏆' : null].filter(Boolean).join(' ');
    const priceInfo = t.lastKnownPriceCents ? `${(t.lastKnownPriceCents / 100).toFixed(2)} ${t.lastKnownCurrency}` : 'bilinmiyor';
    embed.addFields({ name: `${t.name} (${t.appId})`, value: `${flags} | Son bilinen fiyat: ${priceInfo}${t.targetPrice ? ` | Hedef: ${t.targetPrice}` : ''}` });
  }

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleTrackAdd, handleTrackRemove, handleTrackList };
