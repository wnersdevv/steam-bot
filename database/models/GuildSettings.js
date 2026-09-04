'use strict';

const { Schema, model } = require('mongoose');

const GuildSettingsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    adminRoleId: { type: String },
    logChannelId: { type: String },
    priceAlertChannelId: { type: String },
    newsChannelId: { type: String },
    giveawayChannelId: { type: String },
    trackedNewsAppIds: { type: [Number], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = model('GuildSettings', GuildSettingsSchema);
