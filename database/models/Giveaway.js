'use strict';

const { Schema, model } = require('mongoose');

const GiveawaySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, index: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    appId: { type: Number }, // ilişkili Steam oyunu varsa (opsiyonel)
    winnerCount: { type: Number, default: 1 },
    participantIds: { type: [String], default: [] },
    winnerIds: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'ended', 'cancelled'], default: 'active', index: true },
    endsAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('Giveaway', GiveawaySchema);
