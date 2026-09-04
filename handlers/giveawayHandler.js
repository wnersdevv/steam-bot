'use strict';

const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { buildPanel, panelPayload } = require('../components/v2Builder');
const { createGiveaway, attachMessageId, joinGiveaway, endGiveaway, cancelGiveaway, listActiveGiveaways, getGiveaway } = require('../services/giveawayService');
const { requireAdmin } = require('../utils/permissions');
const { parseDurationToMs, toDiscordTimestamp } = require('../utils/duration');
const { addAuditLog } = require('../services/auditService');
const { checkRateLimit } = require('../utils/rateLimit');

function giveawayContainer(giveaway) {
  return buildPanel({
    accentColor: 0xeb459e,
    blocks: [
      { type: 'text', content: `## 🎉 ÇEKİLİŞ: ${giveaway.prize}` },
      {
        type: 'text',
        content:
          `🎁 **Ödül:** ${giveaway.prize}\n` +
          `🏆 **Kazanan sayısı:** ${giveaway.winnerCount}\n` +
          `⏰ **Bitiş:** ${toDiscordTimestamp(giveaway.endsAt.getTime(), 'R')}\n` +
          `👥 **Katılımcı:** ${giveaway.participantIds.length}\n` +
          `🎙️ **Başlatan:** <@${giveaway.hostId}>`,
      },
      {
        type: 'actionRow',
        row: new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`wners|cekilis|katil|${giveaway._id}`).setLabel('Katıl / Ayrıl').setEmoji('🎉').setStyle(ButtonStyle.Success)
        ),
      },
    ],
  });
}

async function handleGiveawayStart(interaction) {
  if (!(await requireAdmin(interaction))) return;

  const prize = interaction.options.getString('odul', true);
  const durationRaw = interaction.options.getString('sure', true);
  const winnerCount = interaction.options.getInteger('kazanan-sayisi') || 1;
  const channel = interaction.options.getChannel('kanal') || interaction.channel;

  const durationMs = parseDurationToMs(durationRaw);
  if (!durationMs || durationMs < 60000) {
    return interaction.reply({ content: '❌ Geçersiz süre. Örnek: `10dk`, `1h`, `2gün`.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const giveaway = await createGiveaway({
    guildId: interaction.guildId,
    channelId: channel.id,
    hostId: interaction.user.id,
    prize,
    winnerCount,
    endsAt: new Date(Date.now() + durationMs),
  });

  const message = await channel.send(panelPayload(giveawayContainer(giveaway), { ephemeral: false }));
  await attachMessageId(giveaway._id, message.id);

  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'cekilis_baslatildi', metadata: { prize, winnerCount } });

  await interaction.editReply({ content: `✅ Çekiliş başlatıldı: <#${channel.id}>` });
}

async function handleGiveawayJoin(interaction, giveawayId) {
  const rl = checkRateLimit(`cekilis-katil:${interaction.user.id}`, 5, 5000);
  if (!rl.allowed) return interaction.reply({ content: '⏳ Çok hızlısın, biraz bekle.', ephemeral: true });

  const result = await joinGiveaway(giveawayId, interaction.user.id);
  if (!result.ok) {
    const messages = { not_found: '❌ Çekiliş bulunamadı.', not_active: '❌ Bu çekiliş artık aktif değil.', host_cannot_join: '❌ Çekilişi başlatan kişi katılamaz.' };
    return interaction.reply({ content: messages[result.reason] || '❌ İşlem başarısız.', ephemeral: true });
  }

  await interaction.reply({ content: result.joined ? '✅ Çekilişe katıldın!' : '↩️ Çekilişten ayrıldın.', ephemeral: true });

  try {
    const message = interaction.message;
    if (message) await message.edit(panelPayload(giveawayContainer(result.giveaway), { ephemeral: false }));
  } catch {
    // mesaj güncellenemezse sessizce geç, katılım zaten kaydedildi
  }
}

async function handleGiveawayEnd(interaction) {
  if (!(await requireAdmin(interaction))) return;
  const giveawayId = interaction.options.getString('id', true);
  await interaction.deferReply({ ephemeral: true });

  const result = await endGiveaway(giveawayId);
  if (!result.ok) return interaction.editReply({ content: '❌ Çekiliş bulunamadı ya da zaten sona ermiş.' });

  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'cekilis_erken_bitirildi', metadata: { giveawayId } });

  const winnerText = result.winners.length > 0 ? result.winners.map((id) => `<@${id}>`).join(', ') : 'Katılımcı yoktu.';
  await interaction.editReply({ content: `✅ Çekiliş sonlandırıldı. Kazanan(lar): ${winnerText}` });

  try {
    const channel = await interaction.guild.channels.fetch(result.giveaway.channelId).catch(() => null);
    if (channel) {
      const container = buildPanel({
        accentColor: 0xeb459e,
        blocks: [{ type: 'text', content: `## 🎉 ÇEKİLİŞ SONA ERDİ: ${result.giveaway.prize}` }, { type: 'text', content: `Kazanan(lar): ${winnerText}` }],
      });
      await channel.send(panelPayload(container, { ephemeral: false }));
    }
  } catch {
    // kanal bulunamadıysa sadece admin'e verilen yanıt yeterli
  }
}

async function handleGiveawayCancel(interaction) {
  if (!(await requireAdmin(interaction))) return;
  const giveawayId = interaction.options.getString('id', true);
  await interaction.deferReply({ ephemeral: true });

  const result = await cancelGiveaway(giveawayId);
  if (!result.ok) return interaction.editReply({ content: '❌ Çekiliş bulunamadı.' });

  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'cekilis_iptal_edildi', metadata: { giveawayId } });
  await interaction.editReply({ content: '✅ Çekiliş iptal edildi.' });
}

async function handleGiveawayList(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const giveaways = await listActiveGiveaways(interaction.guildId);
  if (giveaways.length === 0) return interaction.editReply({ content: 'Aktif çekiliş yok.' });

  const lines = giveaways.map((g) => `🎁 **${g.prize}** — id: \`${g._id}\` — bitiş: ${toDiscordTimestamp(new Date(g.endsAt).getTime(), 'R')} — ${g.participantIds.length} katılımcı`);
  await interaction.editReply({ content: lines.join('\n') });
}

module.exports = { handleGiveawayStart, handleGiveawayJoin, handleGiveawayEnd, handleGiveawayCancel, handleGiveawayList, giveawayContainer };
