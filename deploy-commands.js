'use strict';

const { REST, Routes } = require('discord.js');
const { loadConfig } = require('./config/config');
const { getCommandJson } = require('./commands/index');
const logger = require('./utils/logger');

async function main() {
  const config = loadConfig();
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  const body = getCommandJson();

  try {
    if (config.discord.globalCommands) {
      logger.info(`${body.length} global komut kaydediliyor... (yayılması ~1 saat sürebilir)`);
      await rest.put(Routes.applicationCommands(config.discord.clientId), { body });
      logger.info('✅ Global komutlar kaydedildi.');
    } else {
      if (!config.discord.guildId || config.discord.guildId.includes('BURAYA')) {
        logger.error('❌ "discord.guildId" doldurulmamış. Guild-scoped kayıt için gereklidir (ya da "globalCommands": true yapın).', null);
        process.exit(1);
      }
      logger.info(`${body.length} komut "${config.discord.guildId}" sunucusuna kaydediliyor...`);
      await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), { body });
      logger.info('✅ Sunucuya özel komutlar kaydedildi (anında aktif olur).');
    }
  } catch (err) {
    logger.error('Komut kaydı başarısız oldu', err);
    process.exit(1);
  }
}

main();
