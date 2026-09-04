'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'ayarlar.json');

function fail(message) {
  console.error('❌ Yapılandırma hatası');
  console.error(message);
  process.exit(1);
}

function isPlaceholder(value) {
  return typeof value !== 'string' || value.trim() === '' || value.includes('_BURAYA');
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fail(`"ayarlar.json" bulunamadı. Proje kökünde "ayarlar.json" dosyasını oluşturup gerekli alanları doldurun.`);
  }

  let raw;
  try {
    raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  } catch (err) {
    fail(`"ayarlar.json" okunamadı: ${err.message}`);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    fail(`"ayarlar.json" geçerli bir JSON değil: ${err.message}`);
  }

  const missing = [];
  if (isPlaceholder(config?.discord?.token)) missing.push('discord.token');
  if (isPlaceholder(config?.discord?.clientId)) missing.push('discord.clientId');
  if (isPlaceholder(config?.mongodb?.uri)) missing.push('mongodb.uri');
  if (isPlaceholder(config?.steam?.apiKey)) missing.push('steam.apiKey');

  if (missing.length > 0) {
    fail(`Eksik veya doldurulmamış alan(lar):\n  - ${missing.join('\n  - ')}`);
  }

  // AI opsiyoneldir: enabled=true ama apiKey placeholder ise net şekilde uyar ve
  // AI özelliklerini "yapılandırılmamış" moduna al (sahte sonuç üretmez).
  config.ai = config.ai || {};
  config.ai.configured = Boolean(config.ai.enabled) && !isPlaceholder(config.ai.apiKey);
  if (config.ai.enabled && !config.ai.configured) {
    console.warn('⚠️  AI özelliği "enabled: true" olarak ayarlanmış ama "ai.apiKey" doldurulmamış. AI özellikleri devre dışı kalacak.');
  }

  config.discord.globalCommands = Boolean(config.discord.globalCommands);

  config.scheduler = Object.assign(
    {
      priceCheckIntervalMinutes: 60,
      achievementCheckIntervalMinutes: 30,
      friendStatusIntervalMinutes: 5,
      newsCheckIntervalMinutes: 30,
      giveawayCheckIntervalMinutes: 1,
    },
    config.scheduler || {}
  );

  config.cache = Object.assign(
    {
      steamProfileTtlSeconds: 300,
      steamAppTtlSeconds: 3600,
      steamPriceTtlSeconds: 1800,
    },
    config.cache || {}
  );

  return config;
}

module.exports = { loadConfig, CONFIG_PATH };
