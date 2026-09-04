'use strict';

const { EmbedBuilder } = require('discord.js');
const { getLinkedAccount } = require('../services/steamAccountService');
const { getFriendList, getPlayerSummary } = require('../services/steamApiService');
const { failReasonMessage } = require('./accountHandler');
const { checkRateLimit } = require('../utils/rateLimit');

const PERSONA_STATE = { 0: '⚫ Çevrimdışı', 1: '🟢 Çevrimiçi', 2: '🔴 Meşgul', 3: '🌙 Uzakta', 4: '😴 Uykuda', 5: '🔁 Takas için çevrimiçi', 6: '🎮 Oyun için çevrimiçi' };

async function handleFriends(interaction) {
  const rl = checkRateLimit(`arkadaslar:${interaction.user.id}`, 5, 30000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlı istek atıyorsun, biraz bekle.', ephemeral: true });

  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  await interaction.deferReply({ ephemeral: true });

  const account = await getLinkedAccount(targetUser.id);
  if (!account) {
    const who = targetUser.id === interaction.user.id ? 'Steam hesabını bağlamadın.' : 'Bu kullanıcı Steam hesabını bağlamamış.';
    return interaction.editReply({ content: `❌ ${who}` });
  }

  const friendsResult = await getFriendList(account.steamId64);
  if (!friendsResult.ok) {
    if (friendsResult.reason === 'private_profile') return interaction.editReply({ content: '🔒 Bu profilin arkadaş listesi gizli.' });
    return interaction.editReply({ content: failReasonMessage(friendsResult.reason) });
  }

  const ids = friendsResult.friends.slice(0, 100).map((f) => f.steamid);
  if (ids.length === 0) {
    return interaction.editReply({ content: 'Arkadaş listesi boş görünüyor.' });
  }

  // GetPlayerSummaries tek seferde en fazla 100 steamid kabul eder; burada
  // sadece ilk hesabın durumu için tek tek örnekleme yapıyoruz (rate limit
  // dostu olması için ilk 10 ile sınırlandırıldı).
  const sampleIds = ids.slice(0, 10);
  const summaries = [];
  for (const id of sampleIds) {
    const res = await getPlayerSummary(id);
    if (res.ok) summaries.push(res.player);
  }

  const embed = new EmbedBuilder()
    .setTitle(`👥 ${account.personaName} — Arkadaşlar (${friendsResult.friends.length})`)
    .setColor(0x5865f2)
    .setDescription(
      summaries.length > 0
        ? summaries.map((p) => `${PERSONA_STATE[p.personastate] || '❓'} **${p.personaname}**`).join('\n')
        : 'Arkadaşların durum bilgisi alınamadı (profilleri gizli olabilir).'
    )
    .setFooter({ text: friendsResult.friends.length > 10 ? `İlk 10 arkadaş gösteriliyor (toplam ${friendsResult.friends.length})` : 'Tüm arkadaşlar gösteriliyor' });

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleFriends };
