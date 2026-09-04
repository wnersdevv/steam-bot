'use strict';

const fs = require('fs');
const path = require('path');
const { TrackedGame, GuildSettings, Giveaway } = require('../database/models');

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function exportGuildData(guildId) {
  const [trackedGames, guildSettings, giveaways] = await Promise.all([
    TrackedGame.find({ guildId }).lean(),
    GuildSettings.findOne({ guildId }).lean(),
    Giveaway.find({ guildId }).lean(),
  ]);

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    guildId,
    guildSettings: guildSettings || null,
    trackedGames,
    giveaways,
  };

  ensureBackupDir();
  const filePath = path.join(BACKUP_DIR, `wnersdev-backup-${guildId}-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

  return { ok: true, filePath, payload };
}

function validateBackupPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') errors.push('Geçersiz JSON gövdesi.');
  if (payload && payload.schemaVersion !== 1) errors.push('Desteklenmeyen schemaVersion.');
  if (payload && !Array.isArray(payload.trackedGames)) errors.push('"trackedGames" bir dizi olmalı.');
  if (payload && !Array.isArray(payload.giveaways)) errors.push('"giveaways" bir dizi olmalı.');
  return errors;
}

async function importGuildData(guildId, payload) {
  const errors = validateBackupPayload(payload);
  if (errors.length > 0) return { ok: false, reason: 'validation_error', errors };

  let importedGames = 0;
  let skippedGames = 0;

  for (const game of payload.trackedGames || []) {
    if (!game.discordUserId || !game.appId || !game.name) {
      skippedGames++;
      continue;
    }
    await TrackedGame.findOneAndUpdate(
      { discordUserId: game.discordUserId, appId: game.appId },
      { ...game, guildId, _id: undefined },
      { upsert: true }
    );
    importedGames++;
  }

  if (payload.guildSettings) {
    const { _id, ...settingsData } = payload.guildSettings;
    await GuildSettings.findOneAndUpdate({ guildId }, { ...settingsData, guildId }, { upsert: true });
  }

  return { ok: true, importedGames, skippedGames };
}

module.exports = { exportGuildData, importGuildData, validateBackupPayload, BACKUP_DIR };
