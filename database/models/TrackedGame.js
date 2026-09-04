'use strict';

const { Schema, model } = require('mongoose');

const TrackedGameSchema = new Schema(
  {
    discordUserId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    appId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    trackPrice: { type: Boolean, default: true },
    targetPrice: { type: Number }, // en düşük bu fiyata inince bildirim gönder (opsiyonel)
    trackAchievements: { type: Boolean, default: false },
    lastKnownPriceCents: { type: Number },
    lastKnownCurrency: { type: String },
    lastAchievementCount: { type: Number },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TrackedGameSchema.index({ discordUserId: 1, appId: 1 }, { unique: true });

module.exports = model('TrackedGame', TrackedGameSchema);
