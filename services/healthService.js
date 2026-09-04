'use strict';

const { isDatabaseConnected } = require('../database/db');
const { isAiConfigured } = require('./aiService');

let steamApiKeyConfigured = false;
let schedulerRunning = false;
let queues = [];

function registerHealthSources({ steamConfigured, queueList }) {
  steamApiKeyConfigured = Boolean(steamConfigured);
  queues = queueList || [];
}

function setSchedulerRunning(value) {
  schedulerRunning = value;
}

function getHealthSnapshot(client) {
  return {
    botReady: client.isReady(),
    database: isDatabaseConnected(),
    steamApiConfigured: steamApiKeyConfigured,
    aiConfigured: isAiConfigured(),
    scheduler: schedulerRunning,
    guildCount: client.guilds.cache.size,
    wsLatencyMs: client.ws.ping,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    queues: queues.map((q) => q.stats),
  };
}

module.exports = { registerHealthSources, setSchedulerRunning, getHealthSnapshot };
