'use strict';

/**
 * "1d", "7d", "30d", "1m", "3m", "6m", "1y", "2h", "30dk" gibi formatları
 * milisaniyeye çevirir. Ay/yıl sabit gün karşılıklarıyla hesaplanır
 * (1m = 30 gün, 1y = 365 gün) — UTC epoch ms üzerinden çalışıldığı için
 * timezone/DST sorunları oluşmaz.
 */
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function parseDurationToMs(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10) * DAY_MS;
  }

  const match = raw.match(/^(\d+)\s*(dk|m|min|dakika|h|saat|d|gün|g|month|ay|y|yıl|year)$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  if (!(amount > 0)) return null;
  const unit = match[2];

  if (['dk', 'min', 'dakika'].includes(unit)) return amount * MINUTE_MS;
  if (['h', 'saat'].includes(unit)) return amount * HOUR_MS;
  if (['d', 'gün', 'g'].includes(unit)) return amount * DAY_MS;
  if (['month', 'ay'].includes(unit)) return amount * 30 * DAY_MS;
  if (['y', 'yıl', 'year'].includes(unit)) return amount * 365 * DAY_MS;

  return null;
}

function nowMs() {
  return Date.now();
}

function toDiscordTimestamp(ms, style = 'F') {
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

function formatRemaining(ms) {
  if (ms <= 0) return '0 dakika';
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0) parts.push(`${hours} saat`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} dakika`);
  return parts.length ? parts.join(' ') : '1 dakikadan az';
}

module.exports = { parseDurationToMs, nowMs, toDiscordTimestamp, formatRemaining, MINUTE_MS, HOUR_MS, DAY_MS };
