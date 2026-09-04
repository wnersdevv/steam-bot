'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let connected = false;

async function connectDatabase(uri) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB bağlantı hatası', err);
  });
  mongoose.connection.on('disconnected', () => {
    connected = false;
    logger.warn('MongoDB bağlantısı koptu, mongoose otomatik olarak yeniden bağlanmayı deneyecek.');
  });
  mongoose.connection.on('reconnected', () => {
    connected = true;
    logger.info('MongoDB bağlantısı yeniden kuruldu.');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  connected = true;
  logger.info('MongoDB bağlantısı kuruldu.');
}

function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseConnected, mongoose };
