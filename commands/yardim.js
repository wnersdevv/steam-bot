'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { handleHelp } = require('../handlers/helpHandler');

const data = new SlashCommandBuilder().setName('yardim').setDescription('Tüm komutları ve kullanımlarını göster');

async function execute(interaction) {
  return handleHelp(interaction);
}

module.exports = { data, execute };
