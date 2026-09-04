'use strict';

const { cache } = require('./cacheService');
const logger = require('../utils/logger');

const WEB_API_BASE = 'https://api.steampowered.com';
const STORE_API_BASE = 'https://store.steampowered.com/api';

let API_KEY = null;
let CACHE_TTL = { profile: 300, app: 3600, price: 1800 };

function configureSteamApi({ apiKey, cacheTtl }) {
  API_KEY = apiKey;
  if (cacheTtl) CACHE_TTL = { ...CACHE_TTL, ...cacheTtl };
}

/**
 * Tüm Steam istekleri bu fonksiyondan geçer. Ağ/API hatalarında bot asla
 * çökmez — { ok:false, reason } döner ve çağıran taraf bunu kullanıcıya
 * açıkça iletir.
 */
async function steamFetch(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429) return { ok: false, reason: 'rate_limited' };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthorized' };
    if (!res.ok) return { ok: false, reason: 'http_error', status: res.status };

    const data = await res.json().catch(() => null);
    if (data === null) return { ok: false, reason: 'invalid_response' };
    return { ok: true, data };
  } catch (err) {
    logger.error('Steam API isteği başarısız oldu', err, { url: url.split('?')[0] });
    return { ok: false, reason: 'network_error', detail: err.message };
  }
}

function requireApiKey() {
  if (!API_KEY) return { ok: false, reason: 'no_api_key' };
  return null;
}

/** Vanity URL (örn. "gaben") -> SteamID64 çözümler. Zaten 17 haneli bir ID verilmişse doğrudan onu döner. */
async function resolveSteamId(input) {
  const trimmed = String(input).trim();
  if (/^\d{17}$/.test(trimmed)) return { ok: true, steamId64: trimmed };

  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  // Kullanıcı tam profil linki verdiyse vanity adını çıkar
  let vanity = trimmed;
  const urlMatch = trimmed.match(/steamcommunity\.com\/(id|profiles)\/([^/]+)/i);
  if (urlMatch) {
    if (urlMatch[1] === 'profiles' && /^\d{17}$/.test(urlMatch[2])) {
      return { ok: true, steamId64: urlMatch[2] };
    }
    vanity = urlMatch[2];
  }

  const url = `${WEB_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${API_KEY}&vanityurl=${encodeURIComponent(vanity)}`;
  const result = await steamFetch(url);
  if (!result.ok) return result;

  const body = result.data?.response;
  if (!body || body.success !== 1) return { ok: false, reason: 'not_found' };
  return { ok: true, steamId64: body.steamid };
}

async function getPlayerSummary(steamId64) {
  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  return cache.wrap(`profile:${steamId64}`, CACHE_TTL.profile * 1000, async () => {
    const url = `${WEB_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${steamId64}`;
    const result = await steamFetch(url);
    if (!result.ok) return result;
    const player = result.data?.response?.players?.[0];
    if (!player) return { ok: false, reason: 'not_found' };
    return { ok: true, player };
  });
}

async function getFriendList(steamId64) {
  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  const url = `${WEB_API_BASE}/ISteamUser/GetFriendList/v1/?key=${API_KEY}&steamid=${steamId64}&relationship=friend`;
  const result = await steamFetch(url);
  if (!result.ok) return result;
  const friends = result.data?.friendslist?.friends;
  if (!friends) return { ok: false, reason: 'private_profile' };
  return { ok: true, friends };
}

async function getOwnedGames(steamId64) {
  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  const url = `${WEB_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1`;
  const result = await steamFetch(url);
  if (!result.ok) return result;
  const response = result.data?.response;
  if (!response || response.game_count === undefined) return { ok: false, reason: 'private_profile' };
  return { ok: true, games: response.games || [], count: response.game_count };
}

async function getPlayerAchievements(steamId64, appId) {
  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  const url = `${WEB_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${API_KEY}&steamid=${steamId64}&appid=${appId}`;
  const result = await steamFetch(url);
  if (!result.ok) return result;

  const body = result.data?.playerstats;
  if (!body) return { ok: false, reason: 'unknown' };
  if (body.success === false) {
    // Steam bu durumda genelde "Requested app has no stats" ya da profil gizli der
    return { ok: false, reason: 'no_stats_or_private', message: body.error };
  }
  return { ok: true, achievements: body.achievements || [], gameName: body.gameName };
}

async function getGameSchema(appId) {
  const keyErr = requireApiKey();
  if (keyErr) return keyErr;

  return cache.wrap(`schema:${appId}`, CACHE_TTL.app * 1000, async () => {
    const url = `${WEB_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${API_KEY}&appid=${appId}`;
    const result = await steamFetch(url);
    if (!result.ok) return result;
    const game = result.data?.game;
    if (!game) return { ok: false, reason: 'not_found' };
    return { ok: true, schema: game };
  });
}

async function getGlobalAchievementPercentages(appId) {
  return cache.wrap(`globalach:${appId}`, CACHE_TTL.app * 1000, async () => {
    const url = `${WEB_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;
    const result = await steamFetch(url);
    if (!result.ok) return result;
    const achievements = result.data?.achievementpercentages?.achievements;
    if (!achievements) return { ok: false, reason: 'not_found' };
    return { ok: true, achievements };
  });
}

/** Steam mağaza araması (resmi Web API'de yoktur, storefront JSON uç noktasını kullanır). */
async function searchStoreGames(term, { country = 'us', language = 'english' } = {}) {
  return cache.wrap(`search:${term}:${country}`, 120 * 1000, async () => {
    const url = `${STORE_API_BASE}/storesearch/?term=${encodeURIComponent(term)}&cc=${country}&l=${language}`;
    const result = await steamFetch(url);
    if (!result.ok) return result;
    const items = result.data?.items || [];
    return { ok: true, items };
  });
}

async function getAppDetails(appId, { country = 'us', language = 'english' } = {}) {
  return cache.wrap(`appdetails:${appId}:${country}`, CACHE_TTL.app * 1000, async () => {
    const url = `${STORE_API_BASE}/appdetails?appids=${appId}&cc=${country}&l=${language}`;
    const result = await steamFetch(url);
    if (!result.ok) return result;
    const entry = result.data?.[appId] || result.data?.[String(appId)];
    if (!entry || !entry.success) return { ok: false, reason: 'not_found' };
    return { ok: true, details: entry.data };
  });
}

async function getPrice(appId, { country = 'us', language = 'english' } = {}) {
  const result = await getAppDetails(appId, { country, language });
  if (!result.ok) return result;
  const details = result.details;

  if (details.is_free) {
    return { ok: true, free: true };
  }
  if (!details.price_overview) {
    // Steam bazı ülkelerde/durumlarda fiyat bilgisi vermez (ör. henüz yayınlanmamış oyun)
    return { ok: false, reason: 'no_price_data' };
  }
  return { ok: true, free: false, price: details.price_overview };
}

async function getNewsForApp(appId, { count = 5 } = {}) {
  const url = `${WEB_API_BASE}/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=${count}&maxlength=500&format=json`;
  const result = await steamFetch(url);
  if (!result.ok) return result;
  const items = result.data?.appnews?.newsitems;
  if (!items) return { ok: false, reason: 'not_found' };
  return { ok: true, items };
}

module.exports = {
  configureSteamApi,
  resolveSteamId,
  getPlayerSummary,
  getFriendList,
  getOwnedGames,
  getPlayerAchievements,
  getGameSchema,
  getGlobalAchievementPercentages,
  searchStoreGames,
  getAppDetails,
  getPrice,
  getNewsForApp,
};
