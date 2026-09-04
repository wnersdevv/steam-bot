'use strict';

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadConfig } = require('./config/config');
const { connectDatabase } = require('./database/db');
const { configureSteamApi } = require('./services/steamApiService');
const { configureAiService } = require('./services/aiService');
const { registerHealthSources } = require('./services/healthService');
const { buildCommandCollection } = require('./commands/index');
const { handleInteractionCreate } = require('./handlers/interactionCreateHandler');
const { startScheduler } = require('./scheduler/scheduler');
const logger = require('./utils/logger');

async function main() {
  const config = loadConfig();

  // --- Steam API ve AI servislerini yapılandır ---
  configureSteamApi({ apiKey: config.steam.apiKey, cacheTtl: config.cache });
  configureAiService(config.ai.configured ? { configured: true, apiKey: config.ai.apiKey, model: config.ai.model } : { configured: false });
  registerHealthSources({ steamConfigured: true, queueList: [] });

  // --- MongoDB bağlantısı ---
  try {
    await connectDatabase(config.mongodb.uri);
  } catch (err) {
    logger.error('MongoDB bağlantısı kurulamadı, bot başlatılamıyor.', err);
    process.exit(1);
  }

  // --- Discord istemcisi ---
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
  });

  const commandCollection = buildCommandCollection();

  client.once('ready', () => {
    logger.info(`✅ Bot giriş yaptı: ${client.user.tag} (${client.guilds.cache.size} sunucu)`);
    startScheduler(client, config);
  });

  client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, commandCollection));

  client.on('error', (err) => logger.error('Discord istemci hatası', err));
  client.on('warn', (message) => logger.warn(message));
  client.on('shardError', (err) => logger.error('Shard hatası', err));

  // --- Bot hiçbir zaman beklenmeyen bir hatadan dolayı çökmemeli ---
  process.on('unhandledRejection', (reason) => {
    logger.error('Yakalanmamış Promise reddi (unhandledRejection)', reason instanceof Error ? reason : new Error(String(reason)));
  });
  process.on('uncaughtException', (err) => {
    logger.error('Yakalanmamış istisna (uncaughtException)', err);
  });

  process.on('SIGINT', () => {
    logger.info('Kapatma sinyali alındı (SIGINT), bot kapatılıyor...');
    client.destroy();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info('Kapatma sinyali alındı (SIGTERM), bot kapatılıyor...');
    client.destroy();
    process.exit(0);
  });

  await client.login(config.discord.token);
}

main().catch((err) => {
  logger.error('Bot başlatılamadı', err);
  process.exit(1);
});
