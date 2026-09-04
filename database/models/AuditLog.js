'use strict';

const { Schema, model } = require('mongoose');

const AuditLogSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    targetUserId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = model('AuditLog', AuditLogSchema);
