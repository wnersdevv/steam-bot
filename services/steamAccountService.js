'use strict';

const { SteamAccount } = require('../database/models');
const { resolveSteamId, getPlayerSummary } = require('./steamApiService');

/**
 * SteamID/vanity URL doğrulanıp Discord kullanıcısına bağlanır.
 * ÖNEMLİ SINIRLAMA: Bu, yalnızca verilen SteamID'nin gerçekten var olduğunu
 * doğrular (Steam API üzerinden profil çekilebiliyor mu). Steam hesabının
 * GERÇEKTEN o Discord kullanıcısına ait olduğunun kanıtlanması (ownership)
 * normalde Steam OpenID web akışı gerektirir; bu proje "dashboard/web yok"
 * ilkesiyle kurulduğu için bu doğrulama seviyesi (varlık doğrulama)
 * kullanılmaktadır. Bu sınırlama README'de açıkça belirtilmiştir.
 */
async function linkAccount(discordUserId, steamInput) {
  const resolved = await resolveSteamId(steamInput);
  if (!resolved.ok) return resolved;

  const summaryResult = await getPlayerSummary(resolved.steamId64);
  if (!summaryResult.ok) return summaryResult;

  const player = summaryResult.player;

  const account = await SteamAccount.findOneAndUpdate(
    { discordUserId },
    {
      discordUserId,
      steamId64: resolved.steamId64,
      personaName: player.personaname,
      profileUrl: player.profileurl,
      avatarUrl: player.avatarfull,
      profileVisibility: player.communityvisibilitystate,
      linkedAt: new Date(),
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { ok: true, account };
}

async function unlinkAccount(discordUserId) {
  const result = await SteamAccount.deleteOne({ discordUserId });
  return { ok: result.deletedCount > 0 };
}

async function getLinkedAccount(discordUserId) {
  return SteamAccount.findOne({ discordUserId }).lean();
}

async function refreshAccount(discordUserId) {
  const account = await getLinkedAccount(discordUserId);
  if (!account) return { ok: false, reason: 'not_linked' };

  const summaryResult = await getPlayerSummary(account.steamId64);
  if (!summaryResult.ok) return summaryResult;

  const player = summaryResult.player;
  const updated = await SteamAccount.findOneAndUpdate(
    { discordUserId },
    {
      personaName: player.personaname,
      profileUrl: player.profileurl,
      avatarUrl: player.avatarfull,
      profileVisibility: player.communityvisibilitystate,
      lastSyncedAt: new Date(),
    },
    { new: true }
  );

  return { ok: true, account: updated };
}

module.exports = { linkAccount, unlinkAccount, getLinkedAccount, refreshAccount };
