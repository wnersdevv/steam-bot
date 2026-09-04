'use strict';

const { EmbedBuilder } = require('discord.js');
const { getHealthSnapshot } = require('../services/healthService');

function statusEmoji(ok) {
  return ok ? '🟢' : '🔴';
}

async function handleStatus(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const snapshot = getHealthSnapshot(interaction.client);

  const embed = new EmbedBuilder()
    .setTitle('🩺 WNERSDEV Bot Durumu')
    .setColor(snapshot.database && snapshot.steamApiConfigured ? 0x57f287 : 0xfee75c)
    .addFields(
      { name: 'Bot', value: `${statusEmoji(snapshot.botReady)} ${snapshot.botReady ? 'Çevrimiçi' : 'Bağlanıyor'}`, inline: true },
      { name: 'MongoDB', value: `${statusEmoji(snapshot.database)} ${snapshot.database ? 'Bağlı' : 'Bağlı değil'}`, inline: true },
      { name: 'Steam API', value: `${statusEmoji(snapshot.steamApiConfigured)} ${snapshot.steamApiConfigured ? 'Yapılandırıldı' : 'Yapılandırılmadı'}`, inline: true },
      { name: 'AI Özelliği', value: `${statusEmoji(snapshot.aiConfigured)} ${snapshot.aiConfigured ? 'Yapılandırıldı' : 'Yapılandırılmadı'}`, inline: true },
      { name: 'Scheduler', value: `${statusEmoji(snapshot.scheduler)} ${snapshot.scheduler ? 'Çalışıyor' : 'Durdu'}`, inline: true },
      { name: 'Gecikme (WS Ping)', value: `${snapshot.wsLatencyMs} ms`, inline: true },
      { name: 'Sunucu Sayısı', value: String(snapshot.guildCount), inline: true },
      { name: 'Çalışma Süresi', value: `${Math.floor(snapshot.uptimeSeconds / 3600)}s ${Math.floor((snapshot.uptimeSeconds % 3600) / 60)}dk`, inline: true },
      { name: 'Bellek Kullanımı', value: `${snapshot.memoryMb} MB`, inline: true }
    );

  if (snapshot.queues.length > 0) {
    embed.addFields({ name: 'Kuyruklar', value: snapshot.queues.map((q) => `${q.name}: ${q.active} aktif, ${q.pending} bekliyor`).join('\n') });
  }

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handleStatus };
