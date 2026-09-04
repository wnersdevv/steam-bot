'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { handlePanelCommand } = require('../handlers/panelHandler');

const data = new SlashCommandBuilder().setName('panel').setDescription('WNERSDEV Steam Merkezi ana panelini aç');

async function execute(interaction) {
  return handlePanelCommand(interaction);
}

module.exports = { data, execute };
