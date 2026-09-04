'use strict';

const { EmbedBuilder } = require('discord.js');
const { linkAccount, unlinkAccount, getLinkedAccount, refreshAccount } = require('../services/steamAccountService');
const { getOwnedGames } = require('../services/steamApiService');
const { addAuditLog } = require('../services/auditService');
const { checkRateLimit } = require('../utils/rateLimit');

const VISIBILITY_LABEL = { 1: '🔒 Gizli', 2: '👥 Sadece Arkadaşlar', 3: '🌐 Herkese Açık' };

function failReasonMessage(reason) {
  switch (reason) {
    case 'no_api_key':
      return '⚠️ Steam API anahtarı yapılandırılmamış. Bot yöneticisi "ayarlar.json" içindeki "steam.apiKey" alanını doldurmalı.';
    case 'not_found':
      return '❌ Bu SteamID/kullanıcı adı ile bir Steam profili bulunamadı.';
    case 'rate_limited':
      return '⏳ Steam API şu anda hız sınırına takıldı, birazdan tekrar dene.';
    case 'network_error':
      return '⚠️ Steam API\'ye ulaşılamadı, birazdan tekrar dene.';
    default:
      return `⚠️ Steam isteği başarısız oldu (${reason}).`;
  }
}

async function handleLink(interaction) {
  const rl = checkRateLimit(`steam-bagla:${interaction.user.id}`, 5, 60000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlı işlem yapıyorsun, biraz bekle.', ephemeral: true });

  const input = interaction.options.getString('steamid', true);
  await interaction.deferReply({ ephemeral: true });

  const result = await linkAccount(interaction.user.id, input);
  if (!result.ok) {
    return interaction.editReply({ content: failReasonMessage(result.reason) });
  }

  await addAuditLog({ guildId: interaction.guildId || 'dm', userId: interaction.user.id, action: 'steam_baglandi', metadata: { steamId64: result.account.steamId64 } });

  const embed = new EmbedBuilder()
    .setTitle('✅ Steam hesabı bağlandı')
    .setColor(0x57f287)
    .setThumbnail(result.account.avatarUrl || null)
    .addFields(
      { name: 'Kullanıcı adı', value: result.account.personaName || '-', inline: true },
      { name: 'SteamID64', value: result.account.steamId64, inline: true },
      { name: 'Görünürlük', value: VISIBILITY_LABEL[result.account.profileVisibility] || 'Bilinmiyor', inline: true },
      { name: 'Profil', value: result.account.profileUrl || '-' }
    );

  await interaction.editReply({ embeds: [embed] });
}

async function handleUnlink(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const result = await unlinkAccount(interaction.user.id);
  if (!result.ok) {
    return interaction.editReply({ content: '❌ Bağlı bir Steam hesabın yok.' });
  }
  await addAuditLog({ guildId: interaction.guildId || 'dm', userId: interaction.user.id, action: 'steam_baglantisi_kaldirildi' });
  await interaction.editReply({ content: '✅ Steam hesabı bağlantısı kaldırıldı.' });
}

async function handleRefresh(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const result = await refreshAccount(interaction.user.id);
  if (!result.ok) {
    if (result.reason === 'not_linked') return interaction.editReply({ content: '❌ Bağlı bir Steam hesabın yok. Önce `/steam hesap bağla` kullan.' });
    return interaction.editReply({ content: failReasonMessage(result.reason) });
  }
  await interaction.editReply({ content: `✅ Profil tazelendi: **${result.account.personaName}**` });
}

async function handleProfile(interaction) {
  const targetUser = interaction.options?.getUser?.('kullanici') || interaction.user;
  await interaction.deferReply({ ephemeral: true });

  const account = await getLinkedAccount(targetUser.id);
  if (!account) {
    const who = targetUser.id === interaction.user.id ? 'Henüz Steam hesabını bağlamadın.' : 'Bu kullanıcı Steam hesabını bağlamamış.';
    return interaction.editReply({ content: `❌ ${who}` });
  }

  const gamesResult = await getOwnedGames(account.steamId64);
  const embed = new EmbedBuilder()
    .setTitle(`🎮 ${account.personaName || 'Steam Profili'}`)
    .setURL(account.profileUrl || null)
    .setThumbnail(account.avatarUrl || null)
    .setColor(0x5865f2)
    .addFields(
      { name: 'SteamID64', value: account.steamId64, inline: true },
      { name: 'Görünürlük', value: VISIBILITY_LABEL[account.profileVisibility] || 'Bilinmiyor', inline: true }
    );

  if (gamesResult.ok) {
    const totalPlaytimeHours = Math.round(gamesResult.games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0) / 60);
    embed.addFields(
      { name: 'Sahip olunan oyun', value: String(gamesResult.count), inline: true },
      { name: 'Toplam oynanma süresi', value: `${totalPlaytimeHours} saat`, inline: true }
    );
  } else if (gamesResult.reason === 'private_profile') {
    embed.addFields({ name: 'Oyun kütüphanesi', value: '🔒 Profil gizli olduğu için oyun listesi görünmüyor.' });
  }

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleLink, handleUnlink, handleRefresh, handleProfile, failReasonMessage };
