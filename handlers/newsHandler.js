'use strict';

const { requireAdmin } = require('../utils/permissions');
const { getGuildSettings, updateGuildSettings } = require('../services/guildSettingsService');
const { getAppDetails } = require('../services/steamApiService');
const { failReasonMessage } = require('./accountHandler');
const { addAuditLog } = require('../services/auditService');

async function handleNewsAdd(interaction) {
  if (!(await requireAdmin(interaction))) return;
  const appId = interaction.options.getInteger('appid', true);
  const channel = interaction.options.getChannel('kanal', true);

  await interaction.deferReply({ ephemeral: true });

  const detailsResult = await getAppDetails(appId);
  if (!detailsResult.ok) {
    return interaction.editReply({ content: detailsResult.reason === 'not_found' ? `❌ appid ${appId} bulunamadı.` : failReasonMessage(detailsResult.reason) });
  }

  const settings = await getGuildSettings(interaction.guildId);
  const current = new Set(settings.trackedNewsAppIds || []);
  current.add(appId);

  await updateGuildSettings(interaction.guildId, { trackedNewsAppIds: [...current], newsChannelId: channel.id });
  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'haber_takip_eklendi', metadata: { appId } });

  await interaction.editReply({ content: `✅ **${detailsResult.details.name}** haberleri artık <#${channel.id}> kanalına gönderilecek.` });
}

async function handleNewsRemove(interaction) {
  if (!(await requireAdmin(interaction))) return;
  const appId = interaction.options.getInteger('appid', true);
  await interaction.deferReply({ ephemeral: true });

  const settings = await getGuildSettings(interaction.guildId);
  const current = new Set(settings.trackedNewsAppIds || []);
  if (!current.has(appId)) return interaction.editReply({ content: '❌ Bu oyun haber takibinde değil.' });

  current.delete(appId);
  await updateGuildSettings(interaction.guildId, { trackedNewsAppIds: [...current] });
  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'haber_takip_kaldirildi', metadata: { appId } });

  await interaction.editReply({ content: '✅ Haber takibinden kaldırıldı.' });
}

async function handleNewsList(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const settings = await getGuildSettings(interaction.guildId);
  const ids = settings.trackedNewsAppIds || [];
  if (ids.length === 0) return interaction.editReply({ content: 'Bu sunucuda takip edilen oyun haberi yok.' });

  await interaction.editReply({
    content:
      `📰 **Takip edilen oyun haberleri** (${settings.newsChannelId ? `<#${settings.newsChannelId}>` : 'kanal ayarlı değil'}):\n` +
      ids.map((id) => `• appid: ${id}`).join('\n'),
  });
}

module.exports = { handleNewsAdd, handleNewsRemove, handleNewsList };
