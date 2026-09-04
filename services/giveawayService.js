'use strict';

const { Giveaway } = require('../database/models');

async function createGiveaway({ guildId, channelId, hostId, prize, appId, winnerCount, endsAt }) {
  return Giveaway.create({
    guildId,
    channelId,
    hostId,
    prize,
    appId: appId ?? null,
    winnerCount: winnerCount || 1,
    participantIds: [],
    winnerIds: [],
    status: 'active',
    endsAt,
  });
}

async function attachMessageId(giveawayId, messageId) {
  return Giveaway.findByIdAndUpdate(giveawayId, { messageId }, { new: true });
}

async function getGiveaway(giveawayId) {
  return Giveaway.findById(giveawayId);
}

async function joinGiveaway(giveawayId, userId) {
  const giveaway = await Giveaway.findById(giveawayId);
  if (!giveaway) return { ok: false, reason: 'not_found' };
  if (giveaway.status !== 'active') return { ok: false, reason: 'not_active' };
  if (giveaway.hostId === userId) return { ok: false, reason: 'host_cannot_join' };

  if (giveaway.participantIds.includes(userId)) {
    giveaway.participantIds = giveaway.participantIds.filter((id) => id !== userId);
    await giveaway.save();
    return { ok: true, joined: false, giveaway };
  }

  giveaway.participantIds.push(userId);
  await giveaway.save();
  return { ok: true, joined: true, giveaway };
}

function pickWinners(participantIds, count) {
  const pool = [...participantIds];
  const winners = [];
  while (winners.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function endGiveaway(giveawayId) {
  const giveaway = await Giveaway.findById(giveawayId);
  if (!giveaway) return { ok: false, reason: 'not_found' };
  if (giveaway.status !== 'active') return { ok: false, reason: 'already_ended' };

  const winners = pickWinners(giveaway.participantIds, giveaway.winnerCount);
  giveaway.winnerIds = winners;
  giveaway.status = 'ended';
  await giveaway.save();

  return { ok: true, giveaway, winners };
}

async function cancelGiveaway(giveawayId) {
  const giveaway = await Giveaway.findByIdAndUpdate(giveawayId, { status: 'cancelled' }, { new: true });
  if (!giveaway) return { ok: false, reason: 'not_found' };
  return { ok: true, giveaway };
}

async function listExpiredActiveGiveaways() {
  return Giveaway.find({ status: 'active', endsAt: { $lte: new Date() } });
}

async function listActiveGiveaways(guildId) {
  return Giveaway.find({ guildId, status: 'active' }).sort({ endsAt: 1 }).lean();
}

module.exports = {
  createGiveaway,
  attachMessageId,
  getGiveaway,
  joinGiveaway,
  endGiveaway,
  cancelGiveaway,
  listExpiredActiveGiveaways,
  listActiveGiveaways,
};
