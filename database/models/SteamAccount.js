'use strict';

const { Schema, model } = require('mongoose');

const SteamAccountSchema = new Schema(
  {
    discordUserId: { type: String, required: true, unique: true, index: true },
    steamId64: { type: String, required: true, index: true },
    personaName: { type: String },
    profileUrl: { type: String },
    avatarUrl: { type: String },
    profileVisibility: { type: Number }, // Steam API: 1 = private, 3 = public
    linkedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('SteamAccount', SteamAccountSchema);
