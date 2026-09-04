'use strict';

const { runPriceCheck } = require('./priceJob');
const { runAchievementCheck } = require('./achievementJob');
const { runNewsCheck } = require('./newsJob');
const { runGiveawayCheck } = require('./giveawayJob');
const { runProfileRefresh } = require('./friendStatusJob');
const { setSchedulerRunning } = require('../services/healthService');
const logger = require('../utils/logger');

const handles = [];

/**
 * Her job kendi try/catch'i içinde çalışır — biri patlarsa diğerleri ve bot
 * genel olarak etkilenmez (production error handling gereksinimi).
 */
function safeInterval(name, fn, intervalMs, client) {
  const tick = async () => {
    try {
      await fn(client);
    } catch (err) {
      logger.error(`Scheduler job hatası: ${name}`, err);
    }
  };
  tick(); // ilk çalıştırma hemen
  const handle = setInterval(tick, intervalMs);
  handles.push(handle);
  logger.info(`Scheduler job başlatıldı: ${name} (her ${Math.round(intervalMs / 60000)} dakikada bir)`);
}

function startScheduler(client, config) {
  const s = config.scheduler;

  safeInterval('fiyat-kontrolu', runPriceCheck, s.priceCheckIntervalMinutes * 60 * 1000, client);
  safeInterval('basarim-kontrolu', runAchievementCheck, s.achievementCheckIntervalMinutes * 60 * 1000, client);
  safeInterval('haber-kontrolu', runNewsCheck, s.newsCheckIntervalMinutes * 60 * 1000, client);
  safeInterval('cekilis-kontrolu', runGiveawayCheck, s.giveawayCheckIntervalMinutes * 60 * 1000, client);
  safeInterval('profil-tazeleme', runProfileRefresh, s.friendStatusIntervalMinutes * 60 * 1000, client);

  setSchedulerRunning(true);
  logger.info('Tüm scheduler jobları başlatıldı.');
}

function stopScheduler() {
  for (const handle of handles) clearInterval(handle);
  handles.length = 0;
  setSchedulerRunning(false);
}

module.exports = { startScheduler, stopScheduler };
