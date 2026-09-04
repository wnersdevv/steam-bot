'use strict';

const { TrackedGame } = require('../database/models');
const { getPrice } = require('../services/steamApiService');
const { getGuildSettings } = require('../services/guildSettingsService');
const { sendChannelPanel, sendDm } = require('../services/notificationService');
const logger = require('../utils/logger');

function formatMoney(cents, currency) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

async function runPriceCheck(client) {
  const trackedGames = await TrackedGame.find({ trackPrice: true });
  logger.info(`Fiyat kontrolü başlıyor (${trackedGames.length} takip)`);

  for (const tracked of trackedGames) {
    try {
      const priceResult = await getPrice(tracked.appId);
      if (!priceResult.ok) continue; // no_price_data / rate_limited vb. — sessizce atla, sonraki turda tekrar denenir
      if (priceResult.free) continue;

      const newCents = priceResult.price.final;
      const currency = priceResult.price.currency;
      const oldCents = tracked.lastKnownPriceCents;

      const droppped = oldCents !== null && oldCents !== undefined && newCents < oldCents;
      const hitTarget = tracked.targetPrice != null && newCents / 100 <= tracked.targetPrice;

      if (droppped || (hitTarget && (oldCents === null || oldCents === undefined || oldCents / 100 > tracked.targetPrice))) {
        const settings = await getGuildSettings(tracked.guildId);
        const desc = `**${tracked.name}** fiyatı ${oldCents ? formatMoney(oldCents, currency) + ' → ' : ''}${formatMoney(newCents, currency)} oldu.`;

        await sendDm(client, tracked.discordUserId, { title: '💰 Fiyat düştü!', description: desc });
        if (settings.priceAlertChannelId) {
          await sendChannelPanel(client, settings.priceAlertChannelId, {
            accentColor: 0x57f287,
            title: '💰 Fiyat Düşüşü',
            description: `<@${tracked.discordUserId}> takip ettiği ${desc}`,
          });
        }
      }

      tracked.lastKnownPriceCents = newCents;
      tracked.lastKnownCurrency = currency;
      await tracked.save();
    } catch (err) {
      logger.error('Fiyat kontrolü sırasında hata', err, { appId: tracked.appId, discordUserId: tracked.discordUserId });
    }
  }
}

module.exports = { runPriceCheck };
