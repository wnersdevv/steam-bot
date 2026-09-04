'use strict';

const { TrackedGame } = require('../database/models');
const { getAppDetails, getPrice } = require('./steamApiService');

async function trackGame({ discordUserId, guildId, appId, trackPrice = true, trackAchievements = false, targetPrice }) {
  const detailsResult = await getAppDetails(appId);
  if (!detailsResult.ok) return detailsResult;

  const name = detailsResult.details.name;
  let lastKnownPriceCents = null;
  let lastKnownCurrency = null;

  if (trackPrice) {
    const priceResult = await getPrice(appId);
    if (priceResult.ok && !priceResult.free) {
      lastKnownPriceCents = priceResult.price.final;
      lastKnownCurrency = priceResult.price.currency;
    }
  }

  const doc = await TrackedGame.findOneAndUpdate(
    { discordUserId, appId },
    {
      discordUserId,
      guildId,
      appId,
      name,
      trackPrice,
      trackAchievements,
      targetPrice: targetPrice ?? null,
      lastKnownPriceCents,
      lastKnownCurrency,
    },
    { upsert: true, new: true }
  );

  return { ok: true, tracked: doc };
}

async function untrackGame(discordUserId, appId) {
  const result = await TrackedGame.deleteOne({ discordUserId, appId });
  return { ok: result.deletedCount > 0 };
}

async function listTrackedGames(discordUserId) {
  return TrackedGame.find({ discordUserId }).sort({ addedAt: -1 }).lean();
}

async function listAllTrackedGamesForApp(appId) {
  return TrackedGame.find({ appId }).lean();
}

async function listAllTrackedGames() {
  return TrackedGame.find({}).lean();
}

module.exports = { trackGame, untrackGame, listTrackedGames, listAllTrackedGamesForApp, listAllTrackedGames };
