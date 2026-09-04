'use strict';

const { SteamAccount } = require('../database/models');
const { getPlayerSummary } = require('../services/steamApiService');
const logger = require('../utils/logger');

/**
 * Bağlı tüm Steam hesaplarının persona adı/avatar/görünürlük bilgisini
 * tazeler. Arkadaş listesi ve anlık durum, API maliyeti nedeniyle her
 * kullanıcı için sürekli taranmaz — bunun yerine "/steam arkadaşlar"
 * komutu istek anında canlı veriyi çeker (bkz. commands/steamArkadaslar.js).
 */
async function runProfileRefresh(client) {
  const accounts = await SteamAccount.find({}).lean();
  if (accounts.length === 0) return;
  logger.info(`Profil tazeleme başlıyor (${accounts.length} hesap)`);

  for (const account of accounts) {
    try {
      const result = await getPlayerSummary(account.steamId64);
      if (!result.ok) continue;
      await SteamAccount.updateOne(
        { discordUserId: account.discordUserId },
        {
          personaName: result.player.personaname,
          avatarUrl: result.player.avatarfull,
          profileVisibility: result.player.communityvisibilitystate,
          lastSyncedAt: new Date(),
        }
      );
    } catch (err) {
      logger.error('Profil tazeleme sırasında hata', err, { discordUserId: account.discordUserId });
    }
  }
}

module.exports = { runProfileRefresh };
