'use strict';

const { AuditLog } = require('../database/models');

async function addAuditLog({ guildId, userId, action, targetUserId = null, metadata = {} }) {
  return AuditLog.create({ guildId, userId, action, targetUserId, metadata, createdAt: new Date() });
}

async function listAuditLogs(guildId, limit = 20) {
  return AuditLog.find({ guildId }).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = { addAuditLog, listAuditLogs };
