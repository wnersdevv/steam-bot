'use strict';

const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { buildPanel, panelPayload } = require('../components/v2Builder');
const { TrackedGame, Giveaway } = require('../database/models');

function backHomeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('wners|home|goto').setLabel('Ana Menü').setEmoji('🏠').setStyle(ButtonStyle.Secondary)
  );
}

function homeRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('wners|home|profil').setLabel('Profilim').setEmoji('🎮').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('wners|home|ara').setLabel('Oyun Ara').setEmoji('🔍').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('wners|home|takip').setLabel('Takip Listem').setEmoji('📋').setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('wners|home|leaderboard').setLabel('Leaderboard').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('wners|home|istatistik').setLabel('İstatistik').setEmoji('📊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('wners|home|status').setLabel('Bot Durumu').setEmoji('🩺').setStyle(ButtonStyle.Secondary)
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('wners|home|ayarlar').setLabel('Ayarlar').setEmoji('⚙️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('wners|home|yardim').setLabel('Yardım').setEmoji('❓').setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2, row3];
}

async function buildHomePanel(guildId) {
  const [trackedCount, activeGiveaways] = await Promise.all([
    TrackedGame.countDocuments({ guildId }),
    Giveaway.countDocuments({ guildId, status: 'active' }),
  ]);

  const rows = homeRows();
  return buildPanel({
    accentColor: 0x1b2838,
    blocks: [
      { type: 'text', content: '## 🎮 WNERSDEV STEAM MERKEZİ' },
      { type: 'separator' },
      { type: 'text', content: `📋 Sunucuda takip edilen oyun: **${trackedCount}**\n🎉 Aktif çekiliş: **${activeGiveaways}**` },
      { type: 'separator' },
      { type: 'actionRow', row: rows[0] },
      { type: 'actionRow', row: rows[1] },
      { type: 'actionRow', row: rows[2] },
    ],
  });
}

async function handlePanelCommand(interaction) {
  const container = await buildHomePanel(interaction.guildId);
  await interaction.reply(panelPayload(container, { ephemeral: true }));
}

async function handleHomeGoto(interaction) {
  const container = await buildHomePanel(interaction.guildId);
  await interaction.update(panelPayload(container, { ephemeral: true }));
}

module.exports = { buildHomePanel, backHomeRow, handlePanelCommand, handleHomeGoto };
