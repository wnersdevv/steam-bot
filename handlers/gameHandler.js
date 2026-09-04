'use strict';

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { searchStoreGames, getAppDetails, getPrice } = require('../services/steamApiService');
const { checkRateLimit } = require('../utils/rateLimit');
const { failReasonMessage } = require('./accountHandler');

async function performSearch(interaction, term) {
  const result = await searchStoreGames(term);
  if (!result.ok) return interaction.editReply({ content: failReasonMessage(result.reason) });

  if (result.items.length === 0) {
    return interaction.editReply({ content: `❌ "${term}" için sonuç bulunamadı.` });
  }

  const options = result.items.slice(0, 10).map((item) => ({
    label: item.name.slice(0, 100),
    description: item.price
      ? item.price.final === 0
        ? 'Ücretsiz'
        : `${(item.price.final / 100).toFixed(2)} ${item.price.currency}`
      : 'Fiyat bilgisi yok',
    value: String(item.id),
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(`steam|oyun|secim|${interaction.user.id}`).setPlaceholder('🔍 Detayları görmek için bir oyun seç').addOptions(options)
  );

  const listText = result.items
    .slice(0, 10)
    .map((item, i) => `${i + 1}. **${item.name}** (appid: ${item.id})`)
    .join('\n');

  await interaction.editReply({ content: `🔍 **"${term}" için sonuçlar:**\n${listText}`, components: [row] });
}

async function handleSearch(interaction) {
  const rl = checkRateLimit(`steam-ara:${interaction.user.id}`, 8, 30000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlı arama yapıyorsun, biraz bekle.', ephemeral: true });

  const term = interaction.options.getString('isim', true);
  await interaction.deferReply({ ephemeral: true });
  await performSearch(interaction, term);
}

async function handleSearchModalSubmit(interaction) {
  const rl = checkRateLimit(`steam-ara:${interaction.user.id}`, 8, 30000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlı arama yapıyorsun, biraz bekle.', ephemeral: true });

  const term = interaction.fields.getTextInputValue('aramaTerimi');
  await interaction.deferReply({ ephemeral: true });
  await performSearch(interaction, term);
}

async function fetchAndBuildGameEmbed(appId) {
  const detailsResult = await getAppDetails(appId);
  if (!detailsResult.ok) return { ok: false, reason: detailsResult.reason };
  const d = detailsResult.details;

  const embed = new EmbedBuilder()
    .setTitle(`🎮 ${d.name}`)
    .setURL(`https://store.steampowered.com/app/${appId}`)
    .setColor(0x1b2838)
    .setImage(d.header_image || null)
    .setDescription((d.short_description || '').slice(0, 500));

  if (d.is_free) {
    embed.addFields({ name: 'Fiyat', value: 'Ücretsiz', inline: true });
  } else if (d.price_overview) {
    const p = d.price_overview;
    const discountText = p.discount_percent > 0 ? ` (~~${(p.initial / 100).toFixed(2)}~~ -${p.discount_percent}%)` : '';
    embed.addFields({ name: 'Fiyat', value: `${(p.final / 100).toFixed(2)} ${p.currency}${discountText}`, inline: true });
  } else {
    embed.addFields({ name: 'Fiyat', value: 'Bilinmiyor', inline: true });
  }

  if (d.release_date) embed.addFields({ name: 'Çıkış Tarihi', value: d.release_date.date || 'Bilinmiyor', inline: true });
  if (d.metacritic) embed.addFields({ name: 'Metacritic', value: `${d.metacritic.score}/100`, inline: true });
  if (Array.isArray(d.genres) && d.genres.length) embed.addFields({ name: 'Tür', value: d.genres.map((g) => g.description).join(', ') });
  if (Array.isArray(d.developers) && d.developers.length) embed.addFields({ name: 'Geliştirici', value: d.developers.join(', '), inline: true });

  return { ok: true, embed };
}

async function handleGameInfo(interaction) {
  const appId = interaction.options.getInteger('appid', true);
  await interaction.deferReply({ ephemeral: true });

  const result = await fetchAndBuildGameEmbed(appId);
  if (!result.ok) {
    return interaction.editReply({ content: result.reason === 'not_found' ? `❌ appid ${appId} için oyun bulunamadı.` : failReasonMessage(result.reason) });
  }
  await interaction.editReply({ embeds: [result.embed] });
}

async function handleGameInfoSelect(interaction, appId) {
  await interaction.deferUpdate();
  const result = await fetchAndBuildGameEmbed(Number(appId));
  if (!result.ok) {
    return interaction.followUp({ content: '❌ Oyun bilgisi alınamadı.', ephemeral: true });
  }
  await interaction.followUp({ embeds: [result.embed], ephemeral: true });
}

async function handlePrice(interaction) {
  const appId = interaction.options.getInteger('appid', true);
  await interaction.deferReply({ ephemeral: true });

  const priceResult = await getPrice(appId);
  if (!priceResult.ok) {
    if (priceResult.reason === 'no_price_data') return interaction.editReply({ content: 'ℹ️ Bu oyun için fiyat bilgisi mevcut değil (satışta olmayabilir).' });
    return interaction.editReply({ content: failReasonMessage(priceResult.reason) });
  }

  if (priceResult.free) return interaction.editReply({ content: '💰 Bu oyun **ücretsiz**.' });

  const p = priceResult.price;
  const discountText = p.discount_percent > 0 ? ` (indirim: -%${p.discount_percent}, normal fiyat: ${(p.initial / 100).toFixed(2)} ${p.currency})` : '';
  await interaction.editReply({ content: `💰 Güncel fiyat: **${(p.final / 100).toFixed(2)} ${p.currency}**${discountText}` });
}

module.exports = { handleSearch, handleSearchModalSubmit, handleGameInfo, handleGameInfoSelect, handlePrice, fetchAndBuildGameEmbed };
