'use strict';

const { GuildSettings } = require('../database/models');

async function getGuildSettings(guildId) {
  let settings = await GuildSettings.findOne({ guildId });
  if (!settings) {
    settings = await GuildSettings.create({ guildId });
  }
  return settings;
}

async function updateGuildSettings(guildId, patch) {
  const settings = await GuildSettings.findOneAndUpdate({ guildId }, { $set: patch }, { upsert: true, new: true });
  return settings;
}

module.exports = { getGuildSettings, updateGuildSettings };
