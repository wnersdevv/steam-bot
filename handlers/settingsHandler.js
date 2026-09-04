'use strict';

const { ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require('discord.js');
const { buildPanel, panelPayload } = require('../components/v2Builder');
const { getGuildSettings, updateGuildSettings } = require('../services/guildSettingsService');
const { requireAdmin } = require('../utils/permissions');
const { addAuditLog } = require('../services/auditService');

async function buildSettingsContainer(guildId) {
  const settings = await getGuildSettings(guildId);

  return buildPanel({
    accentColor: 0x99aab5,
    blocks: [
      { type: 'text', content: '## ⚙️ AYARLAR' },
      {
        type: 'text',
        content:
          `📜 **Log kanalı:** ${settings.logChannelId ? `<#${settings.logChannelId}>` : 'ayarlı değil'}\n` +
          `💰 **Fiyat bildirim kanalı:** ${settings.priceAlertChannelId ? `<#${settings.priceAlertChannelId}>` : 'ayarlı değil'}\n` +
          `📰 **Haber kanalı:** ${settings.newsChannelId ? `<#${settings.newsChannelId}>` : 'ayarlı değil'}\n` +
          `🎉 **Çekiliş kanalı:** ${settings.giveawayChannelId ? `<#${settings.giveawayChannelId}>` : 'ayarlı değil'}\n` +
          `🛡️ **Yönetici rolü:** ${settings.adminRoleId ? `<@&${settings.adminRoleId}>` : 'ayarlı değil (Administrator/Manage Guild izinleri geçerli)'}`,
      },
      { type: 'separator' },
      { type: 'text', content: '📜 Log kanalını seç:' },
      { type: 'actionRow', row: new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(`ayar|log|${guildId}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Log kanalı seç')) },
      { type: 'text', content: '💰 Fiyat bildirim kanalını seç:' },
      { type: 'actionRow', row: new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(`ayar|fiyat|${guildId}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Fiyat bildirim kanalı seç')) },
      { type: 'text', content: '📰 Haber kanalını seç:' },
      { type: 'actionRow', row: new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(`ayar|haber|${guildId}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Haber kanalı seç')) },
      { type: 'text', content: '🎉 Çekiliş kanalını seç:' },
      { type: 'actionRow', row: new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(`ayar|cekilis|${guildId}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Çekiliş kanalı seç')) },
      { type: 'text', content: '🛡️ Yönetici rolünü seç:' },
      { type: 'actionRow', row: new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId(`ayar|rol|${guildId}`).setPlaceholder('Yönetici rolü seç')) },
    ],
  });
}

async function handleSettingsCommand(interaction) {
  if (!(await requireAdmin(interaction))) return;
  await interaction.deferReply({ ephemeral: true });
  const container = await buildSettingsContainer(interaction.guildId);
  await interaction.editReply(panelPayload(container, { ephemeral: true }));
}

async function handleSettingsSelect(interaction, field, guildIdFromCustomId) {
  if (!(await requireAdmin(interaction))) return;
  if (interaction.guildId !== guildIdFromCustomId) {
    return interaction.reply({ content: '❌ Bu panel başka bir sunucuya ait.', ephemeral: true });
  }

  const selected = interaction.values[0];
  const fieldMap = {
    log: 'logChannelId',
    fiyat: 'priceAlertChannelId',
    haber: 'newsChannelId',
    cekilis: 'giveawayChannelId',
    rol: 'adminRoleId',
  };
  const dbField = fieldMap[field];
  if (!dbField) return interaction.reply({ content: '❌ Bilinmeyen ayar.', ephemeral: true });

  await updateGuildSettings(interaction.guildId, { [dbField]: selected });
  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'ayar_guncellendi', metadata: { field: dbField, value: selected } });

  await interaction.deferUpdate();
  const container = await buildSettingsContainer(interaction.guildId);
  await interaction.editReply(panelPayload(container, { ephemeral: true }));
}

module.exports = { handleSettingsCommand, handleSettingsSelect, buildSettingsContainer };
