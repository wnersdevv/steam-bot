'use strict';

const logger = require('../utils/logger');
const panel = require('../handlers/panelHandler');
const account = require('../handlers/accountHandler');
const game = require('../handlers/gameHandler');
const tracking = require('../handlers/trackingHandler');
const leaderboard = require('../handlers/leaderboardHandler');
const stats = require('../handlers/statsHandler');
const settings = require('../handlers/settingsHandler');
const status = require('../handlers/statusHandler');
const help = require('../handlers/helpHandler');
const giveaway = require('../handlers/giveawayHandler');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

/**
 * Tüm buton/select/modal customId'leri "alan|aksiyon|ek" formatındadır.
 * Bilinmeyen bir customId sessizce yok sayılmaz — kullanıcıya açık hata
 * gösterilir ve loglanır (production error handling gereksinimi).
 */

async function routeButton(interaction) {
  const parts = interaction.customId.split('|');
  const [ns, action, sub] = parts;

  try {
    if (ns === 'wners' && action === 'home') {
      switch (sub) {
        case 'goto':
          return panel.handleHomeGoto(interaction);
        case 'profil':
          return account.handleProfile(interaction);
        case 'takip':
          return tracking.handleTrackList(interaction);
        case 'leaderboard':
          return leaderboard.handleLeaderboard(interaction);
        case 'istatistik':
          return stats.handleStats(interaction);
        case 'status':
          return status.handleStatus(interaction);
        case 'ayarlar':
          return settings.handleSettingsCommand(interaction);
        case 'yardim':
          return help.handleHelp(interaction);
        case 'ara': {
          const modal = new ModalBuilder()
            .setCustomId('wners|aramodal')
            .setTitle('Steam\'de Oyun Ara')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('aramaTerimi').setLabel('Oyun adı').setStyle(TextInputStyle.Short).setRequired(true)
              )
            );
          return interaction.showModal(modal);
        }
        default:
          return interaction.reply({ content: '❌ Bilinmeyen menü seçeneği.', ephemeral: true });
      }
    }

    if (ns === 'wners' && action === 'cekilis' && sub === 'katil') {
      const giveawayId = parts[3];
      return giveaway.handleGiveawayJoin(interaction, giveawayId);
    }

    logger.warn('Bilinmeyen buton customId', { customId: interaction.customId });
    return interaction.reply({ content: '❌ Bu buton artık geçerli değil.', ephemeral: true });
  } catch (err) {
    logger.error('Buton işlenirken hata', err, { customId: interaction.customId });
    const payload = { content: '⚠️ Bir hata oluştu, lütfen tekrar dene.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

async function routeSelectMenu(interaction) {
  const parts = interaction.customId.split('|');
  const [ns, action, sub] = parts;

  try {
    if (ns === 'steam' && action === 'oyun' && sub === 'secim') {
      const ownerId = parts[3];
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: '❌ Bu menüyü yalnızca başlatan kişi kullanabilir.', ephemeral: true });
      }
      return game.handleGameInfoSelect(interaction, interaction.values[0]);
    }

    if (ns === 'ayar') {
      const guildIdFromCustomId = parts[2];
      return settings.handleSettingsSelect(interaction, action, guildIdFromCustomId);
    }

    logger.warn('Bilinmeyen select customId', { customId: interaction.customId });
    return interaction.reply({ content: '❌ Bu menü artık geçerli değil.', ephemeral: true });
  } catch (err) {
    logger.error('Select menü işlenirken hata', err, { customId: interaction.customId });
    const payload = { content: '⚠️ Bir hata oluştu, lütfen tekrar dene.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

async function routeModal(interaction) {
  try {
    if (interaction.customId === 'wners|aramodal') {
      return game.handleSearchModalSubmit(interaction);
    }

    logger.warn('Bilinmeyen modal customId', { customId: interaction.customId });
    return interaction.reply({ content: '❌ Bu form artık geçerli değil.', ephemeral: true });
  } catch (err) {
    logger.error('Modal işlenirken hata', err, { customId: interaction.customId });
    const payload = { content: '⚠️ Bir hata oluştu, lütfen tekrar dene.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

module.exports = { routeButton, routeSelectMenu, routeModal };
