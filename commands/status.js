'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { handleStatus } = require('../handlers/statusHandler');

const data = new SlashCommandBuilder().setName('status').setDescription('Bot durumunu ve sağlık bilgisini göster');

async function execute(interaction) {
  return handleStatus(interaction);
}

module.exports = { data, execute };
