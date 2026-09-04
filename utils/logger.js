'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log');

const SENSITIVE_KEYS = ['token', 'apikey', 'api_key', 'password', 'secret', 'uri', 'authorization'];

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function sanitize(value) {
  if (value instanceof Error) return { message: value.message, stack: value.stack };
  if (value && typeof value === 'object') {
    const clone = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) {
      clone[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s)) ? '[gizli]' : sanitize(v);
    }
    return clone;
  }
  return value;
}

function writeLine(filePath, level, message, meta) {
  ensureLogDir();
  const entry = { time: new Date().toISOString(), level, message, ...(meta ? { meta: sanitize(meta) } : {}) };
  fs.appendFile(filePath, JSON.stringify(entry) + '\n', () => {});
}

function info(message, meta) {
  console.log(`[INFO] ${message}`);
  writeLine(COMBINED_LOG, 'info', message, meta);
}

function warn(message, meta) {
  console.warn(`[WARN] ${message}`);
  writeLine(COMBINED_LOG, 'warn', message, meta);
}

function error(message, err, meta) {
  console.error(`[ERROR] ${message}`, err ? err.message || err : '');
  writeLine(COMBINED_LOG, 'error', message, meta);
  writeLine(ERROR_LOG, 'error', message, { ...meta, error: sanitize(err) });
}

module.exports = { info, warn, error };
