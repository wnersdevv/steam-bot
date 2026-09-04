'use strict';

const { listExpiredActiveGiveaways, endGiveaway } = require('../services/giveawayService');
const { buildPanel, panelPayload } = require('../components/v2Builder');
const logger = require('../utils/logger');

async function runGiveawayCheck(client) {
  const expired = await listExpiredActiveGiveaways();
  if (expired.length === 0) return;
  logger.info(`${expired.length} çekiliş sona eriyor`);

  for (const giveaway of expired) {
    try {
      const result = await endGiveaway(giveaway._id);
      if (!result.ok) continue;

      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) continue;

      const winnerText = result.winners.length > 0 ? result.winners.map((id) => `<@${id}>`).join(', ') : 'Katılımcı yok, kazanan seçilemedi.';

      const container = buildPanel({
        accentColor: 0xeb459e,
        blocks: [
          { type: 'text', content: `## 🎉 ÇEKİLİŞ SONA ERDİ: ${giveaway.prize}` },
          { type: 'text', content: `Kazanan(lar): ${winnerText}` },
        ],
      });
      await channel.send(panelPayload(container, { ephemeral: false }));
    } catch (err) {
      logger.error('Çekiliş sonlandırılırken hata', err, { giveawayId: giveaway._id });
    }
  }
}

module.exports = { runGiveawayCheck };
