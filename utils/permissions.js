'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { GuildSettings } = require('../database/models');

async function isBotAdmin(interaction) {
  if (!interaction.inGuild()) return false;
  const member = interaction.member;
  if (!member?.permissions) return false;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  const settings = await GuildSettings.findOne({ guildId: interaction.guildId }).lean();
  if (settings?.adminRoleId) {
    const has = member.roles?.cache?.has(settings.adminRoleId);
    if (has) return true;
  }
  return false;
}

async function requireAdmin(interaction) {
  if (!(await isBotAdmin(interaction))) {
    const payload = { content: '❌ Bu işlemi kullanmak için yetkin yok.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
    return false;
  }
  return true;
}

module.exports = { isBotAdmin, requireAdmin };
