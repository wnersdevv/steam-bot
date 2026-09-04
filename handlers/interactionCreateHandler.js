'use strict';

const logger = require('../utils/logger');
const { routeButton, routeSelectMenu, routeModal } = require('../components/router');

async function handleInteractionCreate(interaction, commandCollection) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandCollection.get(interaction.commandName);
      if (!command) {
        logger.warn('Bilinmeyen slash komutu', { commandName: interaction.commandName });
        return interaction.reply({ content: '❌ Bu komut artık mevcut değil.', ephemeral: true });
      }
      return await command.execute(interaction);
    }

    if (interaction.isButton()) {
      return await routeButton(interaction);
    }

    if (interaction.isAnySelectMenu()) {
      return await routeSelectMenu(interaction);
    }

    if (interaction.isModalSubmit()) {
      return await routeModal(interaction);
    }
  } catch (err) {
    logger.error('interactionCreate işlenirken beklenmeyen hata', err, {
      type: interaction.type,
      customId: interaction.customId,
      commandName: interaction.commandName,
    });

    const payload = { content: '⚠️ Beklenmeyen bir hata oluştu. Bu olay loglandı, teknik detay paylaşılmıyor.', ephemeral: true };
    try {
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
      else if (interaction.isRepliable?.()) await interaction.reply(payload);
    } catch (followUpErr) {
      logger.error('Hata mesajı kullanıcıya iletilemedi', followUpErr);
    }
  }
}

module.exports = { handleInteractionCreate };
