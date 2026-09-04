'use strict';

const { GuildSettings, NewsPostState } = require('../database/models');
const { getNewsForApp } = require('../services/steamApiService');
const { sendChannelPanel } = require('../services/notificationService');
const logger = require('../utils/logger');

async function runNewsCheck(client) {
  const guildSettingsList = await GuildSettings.find({ trackedNewsAppIds: { $exists: true, $ne: [] } });
  logger.info(`Haber kontrolü başlıyor (${guildSettingsList.length} sunucu)`);

  for (const settings of guildSettingsList) {
    if (!settings.newsChannelId) continue;

    for (const appId of settings.trackedNewsAppIds) {
      try {
        const result = await getNewsForApp(appId, { count: 5 });
        if (!result.ok || result.items.length === 0) continue;

        const state = await NewsPostState.findOne({ guildId: settings.guildId, appId });
        const lastGid = state?.lastGid;

        // API en yeniden en eskiye sıralı döner; henüz gönderilmemiş olanları eskiden yeniye gönder
        const toPost = [];
        for (const item of result.items) {
          if (item.gid === lastGid) break;
          toPost.push(item);
        }
        const finalList = (lastGid ? toPost : [result.items[0]]).reverse();

        for (const item of finalList) {
          await sendChannelPanel(client, settings.newsChannelId, {
            accentColor: 0x1b2838,
            title: `📰 ${item.title}`,
            description: `${(item.contents || '').slice(0, 300)}${item.contents?.length > 300 ? '…' : ''}\n\n🔗 ${item.url}`,
          });
        }

        if (result.items[0]) {
          await NewsPostState.findOneAndUpdate(
            { guildId: settings.guildId, appId },
            { lastGid: result.items[0].gid },
            { upsert: true }
          );
        }
      } catch (err) {
        logger.error('Haber kontrolü sırasında hata', err, { guildId: settings.guildId, appId });
      }
    }
  }
}

module.exports = { runNewsCheck };
