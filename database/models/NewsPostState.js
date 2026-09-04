'use strict';

const { Schema, model } = require('mongoose');

const NewsPostStateSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    appId: { type: Number, required: true },
    lastGid: { type: String }, // Steam news item "gid" - son gönderilen haber kimliği
  },
  { timestamps: true }
);

NewsPostStateSchema.index({ guildId: 1, appId: 1 }, { unique: true });

module.exports = model('NewsPostState', NewsPostStateSchema);
